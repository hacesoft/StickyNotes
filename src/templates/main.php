<?php

declare(strict_types=1);

use OCP\Util;

// Záměrně pouze nezávislý Guard. Core ani hlavní bundle se zde nenačítají.
Util::addScript('hc_stickynotes', 'hc-core-guard-2.0.12');
Util::addStyle('hc_stickynotes', 'style-2.0.12');
?>
<div
    id="hc-stickynotes-app"
    data-hc-shared-app-core-guard
    data-app-name="<?php p($l->t('Sticky Notes')); ?>"
    data-app-version="<?php p($_['appVersion']); ?>"
    data-required-core-version="<?php p($_['requiredCoreVersion']); ?>"
    data-required-core-api-version="<?php p($_['requiredCoreApiVersion']); ?>"
    data-core-loading-delay-ms="600"
    data-core-stale-version-attempts="30"
    data-core-stale-version-retry-delay-ms="2000"
    data-core-status-url="<?php p($_['coreStatusUrl']); ?>"
    data-core-style-url="<?php p($_['coreStyleUrl']); ?>"
    data-core-script-url="<?php p($_['coreScriptUrl']); ?>"
    data-app-script-url="<?php p($_['appScriptUrl']); ?>"
    data-app-shell-url="<?php p($_['appShellUrl']); ?>"
    data-core-download-url="<?php p($_['coreDownloadUrl']); ?>"
></div>
