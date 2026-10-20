<?php

declare(strict_types=1);

namespace OCA\HcStickyNotes\Controller;

use OCA\HcStickyNotes\AppInfo\Application;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\IRequest;
use OCP\IURLGenerator;

final class PageController extends Controller {
    public function __construct(IRequest $request, private IURLGenerator $urlGenerator) {
        parent::__construct(Application::APP_ID, $request);
    }

    private function coreManifest(): array {
        $path = dirname(__DIR__, 2) . '/appinfo/hc_shared_app_core.json';
        $raw = @file_get_contents($path);
        if ($raw === false) {
            throw new \RuntimeException('Shared App Core dependency manifest is missing.');
        }
        $manifest = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($manifest)
            || ($manifest['contract'] ?? '') !== 'hc-shared-app-core-v1'
            || !is_string($manifest['requiredVersion'] ?? null)
            || !is_int($manifest['requiredApiVersion'] ?? null)
            || !is_string($manifest['downloadUrl'] ?? null)) {
            throw new \RuntimeException('Shared App Core dependency manifest is invalid.');
        }
        return $manifest;
    }

    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function index(): TemplateResponse {
        $manifest = $this->coreManifest();
        return new TemplateResponse(Application::APP_ID, 'main', [
            'appVersion' => Application::VERSION,
            'requiredCoreVersion' => $manifest['requiredVersion'],
            'requiredCoreApiVersion' => $manifest['requiredApiVersion'],
            'coreDownloadUrl' => $manifest['downloadUrl'],
            'coreStatusUrl' => $this->urlGenerator->linkTo('', 'index.php/apps/hc_shared_app_core/api/v1/status'),
            'coreStyleUrl' => $this->urlGenerator->linkTo('hc_shared_app_core', 'css/workspace.css'),
            'coreScriptUrl' => $this->urlGenerator->linkTo('hc_shared_app_core', 'js/hc_shared_app_core.js'),
            'appScriptUrl' => $this->urlGenerator->linkTo(Application::APP_ID, 'js/app-2.0.12.js'),
            'appShellUrl' => $this->urlGenerator->linkToRoute('hc_stickynotes.page.shell'),
        ]);
    }

    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function shell(): TemplateResponse {
        return new TemplateResponse(Application::APP_ID, 'shell', [], 'blank');
    }
}
