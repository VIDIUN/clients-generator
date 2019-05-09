<?php
/* set this path to the location of Zend/Loader/StandardAutoloader.php, 
 * the client library can be used with any other php5.3 namespace style autoloaders (for example symfony2 & doctrine2)
*/
define('CONFIG_FILE', 'config.ini');

use Vidiun\Client\Configuration as VidiunConfiguration;
use Vidiun\Client\Client as VidiunClient;
use Vidiun\Client\Enum\SessionType as VidiunSessionType;
use Vidiun\Client\ApiException;
use Vidiun\Client\ClientException;

// load zend framework 2
require_once(dirname(__FILE__).'/ClassLoader/ClassLoader.php');
$loader = new Symfony\Component\ClassLoader\ClassLoader();
// register Vidiun namespace
$loader->addPrefix('Vidiun', dirname(__FILE__).'/../library');
$loader->addPrefix('Test', dirname(__FILE__));
$loader->register();

$testerConfig = parse_ini_file(dirname(__FILE__).'/'.CONFIG_FILE);

// init vidiun configuration
$config = new VidiunConfiguration();
$config->setServiceUrl($testerConfig['serviceUrl']);
$config->setCurlTimeout(120);
$config->setLogger(new \Test\SampleLoggerImplementation());

// init vidiun client
$client = new VidiunClient($config);

// generate session
$vs = $client->generateSession($testerConfig['adminSecret'], $testerConfig['userId'], VidiunSessionType::ADMIN, $testerConfig['partnerId']);
$config->getLogger()->log('Vidiun session (vs) was generated successfully: ' . $vs);
$client->setVs($vs);

// check connectivity
try
{
	$client->getSystemService()->ping();
}
catch (ApiException $ex)
{
	$config->getLogger()->log('Ping failed with api error: '.$ex->getMessage());
	die;
}
catch (ClientException $ex)
{
	$config->getLogger()->log('Ping failed with client error: '.$ex->getMessage());
	die;
}

// run the tester
$tester = new \Test\Zend2ClientTester($client, intval($testerConfig['partnerId']));
$tester->run();