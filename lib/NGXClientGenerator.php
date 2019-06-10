<?php

class NGXClientGenerator extends TypescriptClientGenerator
{
	function __construct($xmlPath, Zend_Config $config)
	{
		parent::__construct($xmlPath, $config,"ngx", "projects/vidiun-ngx-client/src/lib/api");
	}
}
