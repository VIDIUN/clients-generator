<?php

class ZendClientTester
{
	const UPLOAD_VIDEO_FILENAME = 'DemoVideo.flv';
	const UPLOAD_IMAGE_FILENAME = 'DemoImage.jpg';
	const ENTRY_NAME = 'Media entry uploaded from Zend Framework client library';
	
	/**
	 * @var Vidiun_Client_Client
	 */
	protected $_client;
	
	/**
	 * @var int
	 */
	protected $_partnerId;

	/**
	 *
	 * @var array
	 */
	protected $_responseHeaders;
	
	public function __construct(Vidiun_Client_Client $client, $partnerId)
	{
		$this->_client = $client;
		$this->_partnerId = $partnerId;
	}
	
	public function run($testerConfig)
	{
		$loginResponse = $this->_client->ottUser->login($testerConfig['partnerId'], $testerConfig['username'], $testerConfig['password']);
		$vs = $loginResponse->loginSession->vs;
		

		$methods = get_class_methods($this);
		foreach($methods as $method)
		{
			if (strpos($method, 'test') === 0)
			{
				try 
				{
					// use the client logger interface to log
					$this->_client->getConfig()->getLogger()->log('Running '.$method);
					$this->_client->setVs($vs);
					$this->$method();
				}
				catch(Exception $ex)
				{
					
					$this->_client->getConfig()->getLogger()->log($method . ' failed with error: ' . $ex->getMessage());
					return;
				}
			}
		}
		echo "\nFinished running client library tests\n";
	}
	
	public function testCreateHousehold() {

		$this->_client->setVs(null);
		
		$username = uniqid();
		$password = 'password';
		$udid = uniqid();
		
		$user = new Vidiun_Client_Type_OTTUser();
		$user->username = $username;

		$household = new Vidiun_Client_Type_Household();
		$household->name = uniqid();
		$household->description = uniqid();
		
		$device = new Vidiun_Client_Type_HouseholdDevice();
		$device->udid = $udid;
		$device->brandId = 1;
		
		$createdUser = $this->_client->ottUser->register($this->_partnerId, $user, $password);
		$this->assertTrue(!is_null($createdUser));
		$this->assertTrue(!is_null($createdUser->id));
		
		$loginResponse = $this->_client->ottUser->login($this->_partnerId, $username, $password);
		$this->_client->setVs($loginResponse->loginSession->vs);
		
		$createdHousehold = $this->_client->household->add($household);
		$this->assertTrue(!is_null($createdHousehold));
		$this->assertTrue(!is_null($createdHousehold->id));

		$loginResponse = $this->_client->ottUser->login($this->_partnerId, $username, $password);
		$this->_client->setVs($loginResponse->loginSession->vs);
		
		$createdDevice = $this->_client->householdDevice->add($device);
		$this->assertTrue(!is_null($createdDevice));
		$this->assertTrue(!is_null($createdDevice->deviceFamilyId));

		$loginResponse = $this->_client->ottUser->login($this->_partnerId, $username, $password, null, $udid);
		$this->_client->setVs($loginResponse->loginSession->vs);

		$devicesList = $this->_client->householdDevice->listAction();
		$this->assertTrue($devicesList->totalCount == 1);
		$this->assertTrue(count($devicesList->objects) == 1);
		$this->assertTrue($devicesList->objects[0]->udid == $udid);
	}
	
	public function testMultiRequest() {
		
		$this->_client->startMultiRequest();

		$this->_client->system->ping();
		$this->_client->system->getVersion();
		$this->_client->system->getTime();

		$response = $this->_client->doMultiRequest();

		foreach( $response as $subResponse)
		{
			if($subResponse instanceof Vidiun_Client_Exception)
			{
				throw new Exception("Error occurred: " . $subResponse->getMessage());
			}
		}

		# when accessing the response object we will use an index and not the response number (response number - 1)
		$this->assertTrue($response[0] === 'true');
		$this->assertTrue(strlen($response[1]) > 0);
		$this->assertTrue($response[2] > 0);
	}
	
	protected function assertTrue($v)
	{
		if ($v !== true)
		{
			$backtrace = debug_backtrace();
			$msg = 'Assert failed on line: ' . $backtrace[0]['line'];
			throw new Exception($msg);
		}
	}

	protected function assertEqual($actual, $expected)
	{
		if ($actual !== $expected)
		{
			$backtrace = debug_backtrace();
			$msg = sprintf(
				"Assert failed on line: {$backtrace[0]['line']}, expecting [%s] of type [%s], actual is [%s] of type [%s]",
				$expected,
				gettype($expected),
				$actual,
				gettype($actual));
			throw new Exception($msg);
		}
	}
}