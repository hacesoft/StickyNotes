/*
 * Hacesoft Sticky Notes – nezávislý zavaděč Shared App Core.
 * Záměrně není závislý na Core JavaScriptu; kontroluje jej před načtením aplikace.
 * Texty chyb využívají překlady Nextcloudu a žádný uživatelský obsah nepřevádějí na HTML.
 */
var HcExampleCoreGuard = (function (exports) {
    'use strict';

    const translate = text => typeof window.t === 'function'
        ? window.t('hc_stickynotes', text)
        : text;

    // Porovnání stabilních verzí a případných vývojových přípon dev.N.
    function isVersionAtLeast(installedVersion, requiredVersion) {
        const parse = version => {
            const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version);
            return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
        };
        const installed = parse(installedVersion);
        const required = parse(requiredVersion);
        if (!installed || !required) return false;

        for (let index = 0; index < 3; index += 1) {
            if ((installed[index] ?? 0) > (required[index] ?? 0)) return true;
            if ((installed[index] ?? 0) < (required[index] ?? 0)) return false;
        }
        if (installedVersion === requiredVersion) return true;
        const installedSuffix = installedVersion.split('-')[1];
        const requiredSuffix = requiredVersion.split('-')[1];
        if (!requiredSuffix) return !installedSuffix;
        if (!installedSuffix) return true;
        const installedDev = /^dev\.(\d+)$/.exec(installedSuffix);
        const requiredDev = /^dev\.(\d+)$/.exec(requiredSuffix);
        return Boolean(installedDev && requiredDev && Number(installedDev[1]) >= Number(requiredDev[1]));
    }

    const sleep = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));

    // Verze jako parametr URL zneplatní staré soubory v cache prohlížeče.
    function withVersion(url, version) {
        const parsedUrl = new URL(url, window.location.href);
        parsedUrl.searchParams.set('v', version);
        return parsedUrl.toString();
    }

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.defer = true;
            script.addEventListener('load', () => resolve(), {once: true});
            script.addEventListener('error', () => reject(new Error('Script load failed.')), {once: true});
            document.head.append(script);
        });
    }

    function loadStyle(url) {
        return new Promise((resolve, reject) => {
            const style = document.createElement('link');
            style.rel = 'stylesheet';
            style.href = url;
            style.addEventListener('load', () => resolve(), {once: true});
            style.addEventListener('error', () => reject(new Error('Stylesheet load failed.')), {once: true});
            document.head.append(style);
        });
    }

    // Indikátor zobrazit až po nastaveném zpoždění, bez probliknutí při rychlém startu.
    function showLoading(config) {
        if (config.element.dataset.coreGuardState !== 'checking') return;
        const section = document.createElement('section');
        section.className = 'hc-shared-app-core-guard-loading';
        section.setAttribute('role', 'status');
        section.setAttribute('aria-live', 'polite');

        const spinner = document.createElement('span');
        spinner.className = 'hc-shared-app-core-guard-loading__spinner';
        spinner.setAttribute('aria-hidden', 'true');
        const label = document.createElement('span');
        label.textContent = translate('Starting application…');
        section.append(spinner, label);
        config.element.replaceChildren(section);
    }

    function showFailure(config, title, message, downloadUrl) {
        const section = document.createElement('section');
        section.className = 'hc-shared-app-core-guard';
        section.setAttribute('role', 'alert');
        const heading = document.createElement('h1');
        heading.textContent = title;
        const detail = document.createElement('p');
        detail.textContent = message;
        const actions = document.createElement('div');
        actions.className = 'hc-shared-app-core-guard__actions';
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = translate('Download Shared App Core');
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.textContent = translate('Retry');
        retry.addEventListener('click', () => window.location.reload());
        actions.append(link, retry);
        section.append(heading, detail, actions);
        config.element.dataset.coreGuardState = 'failed';
        config.element.setAttribute('aria-busy', 'false');
        config.element.replaceChildren(section);
    }

    async function startCoreGuard(config) {
        const attempts = Math.max(1, config.attempts ?? 5);
        const retryDelayMs = Math.max(100, config.retryDelayMs ?? 800);
        const staleAttempts = Math.max(1, config.staleVersionAttempts ?? 30);
        const staleRetryMs = Math.max(250, config.staleVersionRetryDelayMs ?? 2000);
        const loadingDelayMs = Math.max(0, config.loadingDelayMs ?? 600);
        const requiredApiVersion = Math.max(1, config.requiredApiVersion ?? 1);

        config.element.dataset.coreGuardState = 'checking';
        config.element.setAttribute('aria-busy', 'true');
        const spinnerTimeout = window.setTimeout(() => showLoading(config), loadingDelayMs);
        const stopSpinner = () => window.clearTimeout(spinnerTimeout);
        let status = null;
        let failureCount = 0;
        let staleCount = 0;

        // Stav ověřit u serveru; nespoléhat se jen na cache nebo JS dostupný v prohlížeči.
        for (;;) {
            let responseStatus = null;
            try {
                const statusUrl = new URL(config.statusUrl, window.location.href);
                statusUrl.searchParams.set('_guard', String(Date.now()));
                const response = await fetch(statusUrl.toString(), {
                    credentials: 'same-origin',
                    cache: 'no-store',
                    headers: {Accept: 'application/json'}
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.app === 'hc_shared_app_core' &&
                        data.contract === 'hc-shared-app-core-v1' && data.version) {
                        responseStatus = data;
                    }
                }
            } catch (_) {
                // Přechodný výpadek status endpointu vyřeší další pokus.
            }
            if (responseStatus?.version) {
                status = responseStatus;
                if (isVersionAtLeast(status.version, config.requiredVersion) || ++staleCount >= staleAttempts) break;
                await sleep(staleRetryMs);
                continue;
            }
            if (++failureCount >= attempts) break;
            await sleep(retryDelayMs * failureCount);
        }

        if (!status?.version) {
            stopSpinner();
            showFailure(config, translate('Unable to load Sticky Notes'),
                translate('Shared App Core is missing, disabled, or not ready.'), config.downloadUrl);
            return false;
        }
        if (!isVersionAtLeast(status.version, config.requiredVersion)) {
            stopSpinner();
            showFailure(config, translate('Unable to load Sticky Notes'),
                translate('Shared App Core is too old.') + ` (Core ${status.version} / ≥ ${config.requiredVersion})`,
                status.downloadUrl ?? config.downloadUrl);
            return false;
        }

        try {
            await Promise.all([
                loadStyle(withVersion(config.coreStyleUrl, status.version)),
                loadScript(withVersion(config.coreScriptUrl, status.version))
            ]);
            const core = window.HcSharedAppCore;
            if (!core || core.version !== status.version ||
                core.apiVersion !== (status.apiVersion ?? requiredApiVersion) ||
                core.apiVersion < requiredApiVersion) {
                throw new Error('Core frontend and backend contract mismatch.');
            }
            await loadScript(withVersion(config.appScriptUrl, config.appVersion ?? config.requiredVersion));
            stopSpinner();
            config.element.dataset.coreGuardState = 'ready';
            config.element.setAttribute('aria-busy', 'false');
            return true;
        } catch (_) {
            stopSpinner();
            showFailure(config, translate('Unable to load Sticky Notes'),
                translate('Could not load the application or Shared App Core assets.'), config.downloadUrl);
            return false;
        }
    }

    const root = document.querySelector('[data-hc-shared-app-core-guard]');
    if (root) {
        void startCoreGuard({
            element: root,
            appName: root.dataset.appName ?? 'Sticky Notes',
            appVersion: root.dataset.appVersion,
            requiredVersion: root.dataset.requiredCoreVersion ?? '0.1.0',
            statusUrl: root.dataset.coreStatusUrl ?? '',
            coreStyleUrl: root.dataset.coreStyleUrl ?? '',
            coreScriptUrl: root.dataset.coreScriptUrl ?? '',
            appScriptUrl: root.dataset.appScriptUrl ?? '',
            downloadUrl: root.dataset.coreDownloadUrl ?? 'https://github.com/hacesoft/core/releases',
            loadingDelayMs: Number(root.dataset.coreLoadingDelayMs ?? 600),
            staleVersionAttempts: Number(root.dataset.coreStaleVersionAttempts ?? 30),
            staleVersionRetryDelayMs: Number(root.dataset.coreStaleVersionRetryDelayMs ?? 2000),
            requiredApiVersion: Number(root.dataset.requiredCoreApiVersion ?? 1)
        });
    }

    exports.isVersionAtLeast = isVersionAtLeast;
    exports.startCoreGuard = startCoreGuard;
    exports.withVersion = withVersion;
    Object.defineProperty(exports, Symbol.toStringTag, {value: 'Module'});
    return exports;
})({});
