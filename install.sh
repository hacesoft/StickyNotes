#!/bin/sh
set -eu

# Prubezny vystup do terminálu, zatimco podrobnosti jdou do docasneho logu.
# Pruvodce nevyzaduje bash: instalace funguje pres `sudo sh install.sh`.
HC_STEP_NO=0
HC_STEP_TOTAL=19
HC_STEP_ACTIVE=0
HC_INSTALL_LOG="$(mktemp)"
exec 3>&1

hc_step_begin() {
    [ "$HC_STEP_ACTIVE" -eq 0 ] || { printf 'ERROR: Previous step was not finished.\n' >&2; exit 1; }
    HC_STEP_NO=$((HC_STEP_NO + 1))
    [ "$HC_STEP_NO" -le "$HC_STEP_TOTAL" ] || { printf 'ERROR: Too many install steps.\n' >&2; exit 1; }
    printf '[%02d/%02d] %s ..... ' "$HC_STEP_NO" "$HC_STEP_TOTAL" "$1" >&3
    # Jen stdout operaci uvnitr kroku; stderr zustava okamzite viditelny.
    exec 1>>"$HC_INSTALL_LOG"
    HC_STEP_ACTIVE=1
}

hc_step_ok() {
    [ "$HC_STEP_ACTIVE" -eq 1 ] || { printf 'ERROR: No active step.\n' >&2; exit 1; }
    exec 1>&3
    HC_STEP_ACTIVE=0
    printf 'OK\n' >&3
}

hc_step_fail() {
    if [ "$HC_STEP_ACTIVE" -eq 1 ]; then
        exec 1>&3
        HC_STEP_ACTIVE=0
        printf 'CHYBA\n' >&3
    fi
}

hc_progress_cleanup() {
    hc_result="$1"
    if [ "$hc_result" -ne 0 ]; then
        hc_step_fail
        if [ -s "$HC_INSTALL_LOG" ]; then
            printf '%s\n' '--- Podrobnosti posledniho behu instalatoru ---' >&2
            tail -n 50 "$HC_INSTALL_LOG" >&2
        fi
    fi
    rm -f "$HC_INSTALL_LOG"
}

hc_early_exit() {
    hc_result=$?
    trap - EXIT
    hc_progress_cleanup "$hc_result"
    exit "$hc_result"
}
trap hc_early_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

APP_ID="hc_stickynotes"
LEGACY_APP_ID="stickynotes"
APP_NAME="Sticky Notes"
MIN_NC_MAJOR=35
MAX_NC_MAJOR=35
PROJECT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$PROJECT_DIR/scripts/install-transaction.sh"
APP_DIR="$PROJECT_DIR/src"
WEB_CONTAINER=""
CRON_CONTAINER=""

say() { printf '%s\n' "$*"; }
die() { hc_step_fail; printf 'ERROR: %s\n' "$*" >&2; exit 1; }
occ() { docker exec -u www-data "$WEB_CONTAINER" php /var/www/html/occ "$@"; }

hc_step_begin "Kontrola prava spravce a Dockeru"
[ "$(id -u)" -eq 0 ] || die "Run this installer with: sudo sh install.sh"
command -v docker >/dev/null 2>&1 || die "Docker was not found."
chmod 755 "$0" 2>/dev/null || true
hc_step_ok

RUNTIME_ITEMS="appinfo css img js l10n lib templates"

container_has_occ() {
    docker exec "$1" sh -c 'test -f /var/www/html/occ' >/dev/null 2>&1
}

find_containers() {
    if docker ps --format '{{.Names}}' | grep -qx 'nextcloud-app' && container_has_occ 'nextcloud-app'; then WEB_CONTAINER='nextcloud-app'; fi
    if docker ps --format '{{.Names}}' | grep -qx 'nextcloud-cron' && container_has_occ 'nextcloud-cron'; then CRON_CONTAINER='nextcloud-cron'; fi
    if [ -z "$WEB_CONTAINER" ]; then
        for c in $(docker ps --format '{{.Names}}' | grep -Ei 'nextcloud' || true); do
            case "$c" in *cron*) continue ;; esac
            if container_has_occ "$c"; then WEB_CONTAINER="$c"; break; fi
        done
    fi
    if [ -z "$CRON_CONTAINER" ]; then
        for c in $(docker ps --format '{{.Names}}' | grep -Ei 'nextcloud.*cron|cron.*nextcloud' || true); do
            if container_has_occ "$c"; then CRON_CONTAINER="$c"; break; fi
        done
    fi
}

is_enabled() {
    occ app:list --enabled 2>/dev/null | grep -q -- "- $1:"
}

# CLI opcache_reset nevyčistí cache webového PHP; použít šetrné obnovení procesu.
graceful_web_reload() {
    if docker exec "$WEB_CONTAINER" sh -c 'command -v apache2ctl >/dev/null 2>&1'; then
        say "Gracefully reloading Apache web process..."
        docker exec "$WEB_CONTAINER" apache2ctl -k graceful >/dev/null 2>&1 || die "Apache graceful reload failed."
        return 0
    fi
    if docker exec "$WEB_CONTAINER" sh -c 'command -v httpd >/dev/null 2>&1'; then
        say "Gracefully reloading HTTPD web process..."
        docker exec "$WEB_CONTAINER" httpd -k graceful >/dev/null 2>&1 || die "HTTPD graceful reload failed."
        return 0
    fi
    # Signál USR2 poslat jen bezpečně rozpoznanému hlavnímu procesu PHP-FPM.
    if docker exec "$WEB_CONTAINER" sh -c 'ps 2>/dev/null | grep "php-fpm: master process" | grep -v grep >/dev/null 2>&1'; then
        say "Gracefully reloading PHP-FPM web process..."
        if ! docker exec "$WEB_CONTAINER" sh -c 'pid=$(ps | awk "/php-fpm: master process/ && !/awk/ {print \$1; exit}"); [ -n "$pid" ] && kill -USR2 "$pid"'; then
            die "PHP-FPM graceful reload failed."
        fi
        return 0
    fi
    say "Web runtime graceful reload: not available in this container; Guard transition retries remain active."
}

deploy_tree() {
    container="$1"
    tmp="/tmp/${APP_ID}.install.$$"
    new="/tmp/${APP_ID}.new.$$"
    if [ "$container" = "$WEB_CONTAINER" ]; then
        REMOTE_TMP="$tmp" NEW_DIR="$new"
    else
        CRON_TMP="$tmp" CRON_NEW="$new"
    fi
    docker exec "$container" sh -c 'mkdir -p /var/www/html/custom_apps'
    docker exec "$container" rm -rf "$tmp" "$new" >/dev/null 2>&1 || true
    docker exec "$container" mkdir -p "$tmp"
    docker cp "$STAGE/." "$container:$tmp/"
    docker exec "$container" mv "$tmp" "$new"
    docker exec "$container" chown -R www-data:www-data "$new"
    if [ "$container" = "$WEB_CONTAINER" ]; then
        hc_tx_backup_web
        hc_tx_place_web "$new"
    else
        hc_tx_backup_cron
        hc_tx_place_cron "$new"
    fi
}

hc_step_begin "Vyhledani kontejneru Nextcloud"
find_containers
[ -n "$WEB_CONTAINER" ] || die "Could not find the Nextcloud web container."
say "Nextcloud web container: $WEB_CONTAINER"
[ -n "$CRON_CONTAINER" ] && say "Nextcloud cron container: $CRON_CONTAINER"
hc_step_ok

hc_step_begin "Kontrola duplicitnich kopii aplikaci"
# Před prvním occ odsunout staré duplicitní kopie mimo custom_apps.
. "$PROJECT_DIR/scripts/custom-apps-safety.sh"
hc_clean_custom_apps "$APP_ID" "$WEB_CONTAINER" "$CRON_CONTAINER" || die "Could not safely move duplicate application trees out of custom_apps."
hc_step_ok

hc_step_begin "Kontrola kompatibility Nextcloud"
NC_STATUS="$(occ status --output=json 2>/dev/null || true)"
NC_VERSION="$(printf '%s' "$NC_STATUS" | sed -n 's/.*"versionstring":"\([^"]*\)".*/\1/p')"
if [ -n "$NC_VERSION" ]; then
    say "Nextcloud version: $NC_VERSION"
    NC_MAJOR="$(printf '%s' "$NC_VERSION" | cut -d. -f1)"
    case "$NC_MAJOR" in
        ''|*[!0-9]*) ;;
        *) [ "$NC_MAJOR" -ge "$MIN_NC_MAJOR" ] || die "$APP_NAME requires Nextcloud $MIN_NC_MAJOR or newer."
           [ "$NC_MAJOR" -le "$MAX_NC_MAJOR" ] || die "$APP_NAME supports Nextcloud only up to major $MAX_NC_MAJOR." ;;
    esac
fi

hc_step_ok
hc_step_begin "Kontrola uplnosti aplikacnich zdroju"
[ -d "$APP_DIR" ] || die "Application source directory is missing: $APP_DIR"
for item in $RUNTIME_ITEMS; do [ -e "$APP_DIR/$item" ] || die "Required application item is missing in src/: $item"; done
INFO="$APP_DIR/appinfo/info.xml"
[ -f "$INFO" ] || die "src/appinfo/info.xml is missing."
SOURCE_ID="$(sed -n 's:.*<id>\([^<]*\)</id>.*:\1:p' "$INFO" | head -n 1)"
SOURCE_VERSION="$(sed -n 's:.*<version>\([^<]*\)</version>.*:\1:p' "$INFO" | head -n 1)"
[ "$SOURCE_ID" = "$APP_ID" ] || die "Source app id is '$SOURCE_ID', expected '$APP_ID'."
[ -n "$SOURCE_VERSION" ] || die "Could not determine application version."
say "$APP_NAME source id: $SOURCE_ID"
say "$APP_NAME source version: $SOURCE_VERSION"
INSTALLED_VERSION="$(docker exec -u www-data "$WEB_CONTAINER" php /var/www/html/occ config:app:get "$APP_ID" installed_version 2>/dev/null || true)"
say "Install previous version: ${INSTALLED_VERSION:-nová instalace}"
hc_step_ok
hc_step_begin "Kontrola existujicich databazovych dat"
# Chybějící tabulku s již uloženými poznámkami nikdy nenahradit potichu prázdnou.
if ! docker exec -u www-data "$WEB_CONTAINER" php -r 'require "/var/www/html/lib/base.php"; $db=\OC::$server->get(\OCP\IDBConnection::class); $old=$argv[1] !== ""; foreach (["categories","notes","shares","category_shares"] as $suffix) { if (!$db->tableExists("hc_stickynotes_".$suffix) && ($old || $db->tableExists("stickynotes_".$suffix))) exit(1); }' "$INSTALLED_VERSION"; then
    die "A Sticky Notes hc_ table is missing while previous data may exist. Installer did not copy data or create an empty replacement. Restore the hc_ table from your database backup."
fi

hc_step_ok
hc_step_begin "Overeni HC Shared App Core"
# Core ověřit před jakoukoli změnou aplikace.
CORE_MANIFEST="$APP_DIR/appinfo/hc_shared_app_core.json"
[ -f "$CORE_MANIFEST" ] || die "Missing Shared App Core dependency manifest."
CORE_REQUIRED="$(sed -n 's/.*"requiredVersion"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$CORE_MANIFEST" | head -n 1)"
CORE_ID="hc_shared_app_core"
CORE_DIR="/var/www/html/custom_apps/$CORE_ID"
[ -n "$CORE_REQUIRED" ] || die "Could not read required Core version."
docker exec "$WEB_CONTAINER" sh -c "test -f '$CORE_DIR/appinfo/info.xml'" >/dev/null 2>&1 || die "Shared App Core is not installed. Install Core $CORE_REQUIRED+ first or use the bundle installer."
# Ověřit verzi Core registrovanou v Nextcloudu i v souborech; mohou se lišit.
CORE_FILE_VERSION="$(docker exec "$WEB_CONTAINER" sh -c "grep -o '<version>[^<]*</version>' '$CORE_DIR/appinfo/info.xml' | sed 's#<version>##;s#</version>##'" 2>/dev/null || true)"
CORE_INSTALLED_VERSION="$(occ app:list 2>/dev/null | sed -n "s/^[[:space:]]*- $CORE_ID:[[:space:]]*//p" | head -n 1 | tr -d '\r')"
[ -n "$CORE_FILE_VERSION" ] || die "Could not determine Shared App Core file version."
[ -n "$CORE_INSTALLED_VERSION" ] || die "Could not determine Shared App Core installed_version from Nextcloud."
docker exec "$WEB_CONTAINER" php -r "exit(version_compare('$CORE_INSTALLED_VERSION','$CORE_REQUIRED','>=')?0:1);" || die "Shared App Core $CORE_REQUIRED or newer is required; Nextcloud installed_version: $CORE_INSTALLED_VERSION"
if [ "$CORE_FILE_VERSION" != "$CORE_INSTALLED_VERSION" ]; then
    die "Shared App Core version mismatch: files=$CORE_FILE_VERSION, Nextcloud installed_version=$CORE_INSTALLED_VERSION. Finish the Core update before installing $APP_NAME."
fi
if ! is_enabled "$CORE_ID"; then say "Enabling Shared App Core $CORE_INSTALLED_VERSION..."; occ app:enable "$CORE_ID"; fi
for f in js/hc_shared_app_core.js css/workspace.css; do docker exec "$WEB_CONTAINER" sh -c "test -f '$CORE_DIR/$f'" || die "Shared App Core runtime is incomplete: $f"; done
say "Shared App Core dependency: OK ($CORE_INSTALLED_VERSION, required >= $CORE_REQUIRED)"

hc_step_ok
TMP_LOCAL="$(mktemp -d)"
# Chyba kdekoli po výměně obnoví starý kód, stav zapnutí a číslo verze.
install_cleanup() {
    status=$?
    trap - EXIT HUP INT TERM
    hc_progress_cleanup "$status"
    if [ "$status" -ne 0 ]; then
        hc_tx_restore || true
        if [ "${OLD_WAS_ENABLED:-0}" -eq 1 ]; then
            docker exec -u www-data "$WEB_CONTAINER" php /var/www/html/occ app:enable "$LEGACY_APP_ID" >/dev/null 2>&1 || true
        fi
    fi
    hc_cleanup_install_stage
    rm -rf "$TMP_LOCAL"
    exit "$status"
}
trap install_cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
hc_step_begin "Priprava izolovane instalacni kopie"
STAGE="$TMP_LOCAL/$APP_ID"
mkdir -p "$STAGE"
for item in $RUNTIME_ITEMS; do cp -R "$APP_DIR/$item" "$STAGE/"; done
hc_step_ok

hc_step_begin "Syntaxe PHP v nove kopii"
# Před deaktivací aplikace ověřit všechny PHP soubory nové kopie.
LINT_STAGE="/tmp/${APP_ID}.lint.$$"
docker exec "$WEB_CONTAINER" mkdir -p "$LINT_STAGE"
docker cp "$STAGE/." "$WEB_CONTAINER:$LINT_STAGE/"
if ! docker exec "$WEB_CONTAINER" sh -c 'find "$1" -type f -name "*.php" -exec php -l {} \;' sh "$LINT_STAGE" >"$TMP_LOCAL/php-lint.log" 2>&1; then
    cat "$TMP_LOCAL/php-lint.log"
    docker exec "$WEB_CONTAINER" rm -rf "$LINT_STAGE" >/dev/null 2>&1 || true
    die "Staged PHP validation failed."
fi
if grep -q 'Errors parsing' "$TMP_LOCAL/php-lint.log"; then
    cat "$TMP_LOCAL/php-lint.log"
    docker exec "$WEB_CONTAINER" rm -rf "$LINT_STAGE" >/dev/null 2>&1 || true
    die "Staged PHP validation failed."
fi
docker exec "$WEB_CONTAINER" rm -rf "$LINT_STAGE" >/dev/null 2>&1 || true

TARGET_DIR=
hc_step_ok

hc_step_begin "Priprava zaloh a transakce"
TARGET_DIR="/var/www/html/custom_apps/$APP_ID"
LEGACY_DIR="/var/www/html/custom_apps/$LEGACY_APP_ID"
DATA_DIRECTORY="$(occ config:system:get datadirectory)"
case "$DATA_DIRECTORY" in /*) ;; *) die "Cannot locate Nextcloud data directory for deployment backup.";; esac
BACKUP_ROOT="${DATA_DIRECTORY}/hc-core-deployment-backups/${APP_ID}.$(date +%Y%m%d%H%M%S).$$"
BACKUP_OLD="$BACKUP_ROOT/legacy-runtime.tar.gz"
NEW_WAS_ENABLED=0
OLD_WAS_ENABLED=0
OLD_WAS_PRESENT=0
if docker exec "$WEB_CONTAINER" sh -c "test -d '$LEGACY_DIR'"; then
    OLD_WAS_PRESENT=1
    docker exec "$WEB_CONTAINER" mkdir -p "$BACKUP_ROOT"
    docker exec "$WEB_CONTAINER" sh -c "tar -C /var/www/html/custom_apps -czf '$BACKUP_OLD' '$LEGACY_APP_ID'"
fi
if is_enabled "$APP_ID"; then NEW_WAS_ENABLED=1; fi
if is_enabled "$LEGACY_APP_ID"; then OLD_WAS_ENABLED=1; fi
hc_tx_begin "$WEB_CONTAINER" "$CRON_CONTAINER" "$APP_ID" "$TARGET_DIR" "$BACKUP_ROOT" "$INSTALLED_VERSION" "$NEW_WAS_ENABLED"
hc_step_ok
hc_step_begin "Pozastaveni predchozi aplikace"
hc_tx_disable_web
if [ "$OLD_WAS_ENABLED" -eq 1 ]; then
    say "Deactivating legacy app '$LEGACY_APP_ID' before enabling $APP_ID..."
    occ app:disable "$LEGACY_APP_ID"
fi

hc_step_ok
hc_step_begin "Nahrani nove aplikace do weboveho kontejneru"
say "Deploying $APP_ID runtime tree..."
deploy_tree "$WEB_CONTAINER"
hc_step_ok

hc_step_begin "Kontrola synchronizace s cron kontejnerem"
if [ -n "$CRON_CONTAINER" ] && [ "$CRON_CONTAINER" != "$WEB_CONTAINER" ]; then
    PROBE_FILE=".hc-sticky-deploy-probe-$$"
    docker exec "$WEB_CONTAINER" touch "$TARGET_DIR/$PROBE_FILE"
    if docker exec "$CRON_CONTAINER" test -f "$TARGET_DIR/$PROBE_FILE" >/dev/null 2>&1; then
        say "Shared custom_apps detected: cron container already sees the new application."
    else
        say "Deploying $APP_ID into the separate cron custom_apps volume..."
        deploy_tree "$CRON_CONTAINER"
    fi
    docker exec "$WEB_CONTAINER" rm -f "$TARGET_DIR/$PROBE_FILE"
fi

hc_step_ok
hc_step_begin "Obnoveni PHP a webove cache"
say "Resetting CLI PHP OPcache (supplementary only)..."
docker exec "$WEB_CONTAINER" php -r 'if (function_exists("opcache_reset")) { opcache_reset(); }' >/dev/null 2>&1 || true
graceful_web_reload

hc_step_ok
hc_step_begin "Overeni databazoveho schematu"
say "Checking application database structure..."
docker exec -i -u www-data "$WEB_CONTAINER" php -l < "$PROJECT_DIR/scripts/ensure-schema.php" >/dev/null || die "Invalid database check PHP syntax."
docker exec -i -u www-data "$WEB_CONTAINER" php < "$PROJECT_DIR/scripts/ensure-schema.php" || die "Could not complete the application database structure; original rows have not been deleted."
hc_step_ok
hc_step_begin "Zapnuti aplikace v Nextcloudu"
say "Enabling $APP_ID..."
occ app:enable "$APP_ID"

hc_step_ok
hc_step_begin "Overeni instalovane verze"
say "Checking Sticky Notes app version..."
CONFIG_VERSION="$(occ config:app:get "$APP_ID" installed_version 2>/dev/null || true)"
if [ "$CONFIG_VERSION" != "$SOURCE_VERSION" ]; then
    # Cíleně zapsat novou verzi aplikace přes Nextcloud.
    docker exec -u www-data "$WEB_CONTAINER" php -r 'require "/var/www/html/lib/base.php"; if (!\OC_App::updateApp($argv[1])) { throw new \RuntimeException("Application update failed"); }' "$APP_ID" || die "Targeted Sticky Notes app update failed."
fi
CONFIG_VERSION="$(occ config:app:get "$APP_ID" installed_version 2>/dev/null || true)"
[ "$CONFIG_VERSION" = "$SOURCE_VERSION" ] || die "Nextcloud app config version mismatch. Expected: $SOURCE_VERSION, reported: ${CONFIG_VERSION:-missing}"


DEPLOYED_VERSION="$(docker exec "$WEB_CONTAINER" sh -c "grep -o '<version>[^<]*</version>' '$TARGET_DIR/appinfo/info.xml' | sed 's#<version>##;s#</version>##'" 2>/dev/null || true)"
if [ "$DEPLOYED_VERSION" != "$SOURCE_VERSION" ]; then die "Version verification failed. Source: $SOURCE_VERSION, deployed: $DEPLOYED_VERSION"; fi

hc_step_ok
hc_step_begin "Dokonceni migrace stareho App ID"
# Starý běhový kód se odstraní až po ověření nové aplikace; staré tabulky zůstávají.
if [ "$OLD_WAS_PRESENT" -eq 1 ]; then
    say "New identity verified; removing legacy runtime code '$LEGACY_APP_ID' (data retained)."
    docker exec "$WEB_CONTAINER" rm -rf "$LEGACY_DIR" >/dev/null 2>&1 || true
    if [ -n "$CRON_CONTAINER" ] && [ "$CRON_CONTAINER" != "$WEB_CONTAINER" ]; then docker exec "$CRON_CONTAINER" rm -rf "$LEGACY_DIR" >/dev/null 2>&1 || true; fi
fi

hc_step_ok
hc_step_begin "Zaverecna kontrola a souhrn"
# Zálohy kódu ponechat mimo custom_apps pro případnou obnovu.

say "Checking application state..."
occ app:list | grep -A2 -B2 "$APP_ID" || true
say "Sticky Notes technical id: $APP_ID"
say "Sticky Notes version: $DEPLOYED_VERSION"
say "Legacy technical id: $LEGACY_APP_ID (runtime removed after successful data checks; legacy data intentionally retained)"
say "Deployment verification: OK"
say
say "$APP_NAME deployment finished successfully."
say "Installed path: $TARGET_DIR"
say "Project directory: $PROJECT_DIR"
hc_step_ok
SIZE_KIB="$(docker exec "$WEB_CONTAINER" du -sk "$TARGET_DIR" 2>/dev/null | awk 'NR==1 {print $1}')"
case "$SIZE_KIB" in ''|*[!0-9]*) SIZE_KIB='nezjisteno' ;; esac
printf 'Aplikace: %s\nVerze: %s -> %s\nVelikost instalace: %s KiB\nHotovo.\n' \
    "$APP_NAME" "${INSTALLED_VERSION:-nova instalace}" "$SOURCE_VERSION" "$SIZE_KIB"

