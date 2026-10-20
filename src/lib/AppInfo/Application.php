<?php

declare(strict_types=1);

namespace OCA\HcStickyNotes\AppInfo;

use OCA\HcStickyNotes\Dashboard\StickyNotesWidget;
use OCA\HcStickyNotes\Notification\Notifier;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;

class Application extends App implements IBootstrap {
    public const APP_ID = 'hc_stickynotes';
    public const VERSION = '2.0.12';

    public function __construct() {
        parent::__construct(self::APP_ID);
    }

    public function register(IRegistrationContext $context): void {
        $context->registerDashboardWidget(StickyNotesWidget::class);
        $context->registerNotifierService(Notifier::class);
    }

    public function boot(IBootContext $context): void {
    }
}
