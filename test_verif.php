<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$req = Illuminate\Http\Request::create('/api/admin/verifications', 'GET', ['status' => 'all', 'type' => 'all']);
$res = app()->make('App\Http\Controllers\Api\VerificationController')->adminList($req);

echo $res->getContent();
