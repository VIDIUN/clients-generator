<?php
class PhpZendClientGenerator extends ClientGeneratorFromXml
{
	private $cacheTypes = array();

	function __construct($xmlPath, Zend_Config $config, $sourcePath = "zend")
	{
		parent::__construct($xmlPath, $sourcePath, $config);
	}

	function getSingleLineCommentMarker()
	{
		return '//';
	}

	private function cacheEnum(DOMElement $enumNode)
	{
		$enumName = $enumNode->getAttribute('name');
		$enumCacheName = preg_replace('/^Vidiun(.+)$/', '$1', $enumName);

		if($enumNode->hasAttribute('plugin'))
		{
			$pluginName = ucfirst($enumNode->getAttribute('plugin'));
			$this->cacheTypes[$enumName] = "Vidiun_Client_{$pluginName}_Enum_{$enumCacheName}";
		}
		else
		{
			$this->cacheTypes[$enumName] = "Vidiun_Client_Enum_{$enumCacheName}";
		}
	}

	private function cacheType(DOMElement $classNode)
	{
		$className = $classNode->getAttribute('name');
		$classCacheName = preg_replace('/^Vidiun(.+)$/', '$1', $className);

		if($classNode->hasAttribute('plugin'))
		{
			$pluginName = ucfirst($classNode->getAttribute('plugin'));
			$this->cacheTypes[$className] = "Vidiun_Client_{$pluginName}_Type_{$classCacheName}";
		}
		else
		{
			$this->cacheTypes[$className] = "Vidiun_Client_Type_{$classCacheName}";
		}
	}

	function generate()
	{
		parent::generate();

		$xpath = new DOMXPath($this->_doc);

		$enumNodes = $xpath->query("/xml/enums/enum");
		foreach($enumNodes as $enumNode)
			$this->cacheEnum($enumNode);

		$classNodes = $xpath->query("/xml/classes/class");
		foreach($classNodes as $classNode)
			$this->cacheType($classNode);

    	$this->startNewTextBlock();
		$this->appendLine('<?php');

		if($this->generateDocs)
		{
			$this->appendLine('/**');
			$this->appendLine(" * @package $this->package");
			$this->appendLine(" * @subpackage $this->subpackage");
			$this->appendLine(' */');
		}

		$this->appendLine('class Vidiun_Client_TypeMap');
		$this->appendLine('{');

		$classNodes = $xpath->query("/xml/classes/class");
		$this->appendLine('	private static $map = array(');
		$typeMap = array();
		foreach($classNodes as $classNode)
		{
			$vidiunType = $classNode->getAttribute('name');
			$zendType = $this->getTypeClass($vidiunType);
			$typeMap[$vidiunType] = $zendType;
		}
		ksort($typeMap);
		foreach ($typeMap as $vidiunType => $zendType)
			$this->appendLine("		'$vidiunType' => '$zendType',");

		$this->appendLine('	);');
		$this->appendLine('	');

		$this->appendLine('	public static function getZendType($vidiunType)');
		$this->appendLine('	{');
		$this->appendLine('		if(isset(self::$map[$vidiunType]))');
		$this->appendLine('			return self::$map[$vidiunType];');
		$this->appendLine('		return null;');
		$this->appendLine('	}');
		$this->appendLine('}');

    	$this->addFile($this->getMapPath(), $this->getTextBlock());

		// enumes
		$enumNodes = $xpath->query("/xml/enums/enum");
		foreach($enumNodes as $enumNode)
		{
			if(!$this->shouldIncludeType($enumNode->getAttribute('name')))
				continue;

    		$this->startNewTextBlock();
			$this->appendLine('<?php');
			$this->writeEnum($enumNode);
    		$this->addFile($this->getEnumPath($enumNode), $this->getTextBlock());
		}

		// classes
		$classNodes = $xpath->query("/xml/classes/class");
		foreach($classNodes as $classNode)
		{
			if(!$this->shouldIncludeType($classNode->getAttribute('name')))
				continue;

	    	$this->startNewTextBlock();
			$this->appendLine('<?php');
			$this->writeClass($classNode);
    		$this->addFile($this->getTypePath($classNode), $this->getTextBlock());
		}

		// services
		$serviceNodes = $xpath->query("/xml/services/service");
		foreach($serviceNodes as $serviceNode)
		{
			if(!$this->shouldIncludeService($serviceNode->getAttribute("id")))
				continue;

	    	$this->startNewTextBlock();
			$this->appendLine('<?php');
		    $this->writeService($serviceNode);
    		$this->addFile($this->getServicePath($serviceNode), $this->getTextBlock());
		}

    	$this->startNewTextBlock();
		$this->appendLine('<?php');
		$configurationNodes = $xpath->query("/xml/configurations/*");
	    $this->writeMainClient($serviceNodes, $configurationNodes);
    	$this->addFile($this->getMainPath(), $this->getTextBlock());


		// plugins
		$pluginNodes = $xpath->query("/xml/plugins/plugin");
		foreach($pluginNodes as $pluginNode)
		{
			if (!$this->shouldAddPlugin($pluginNode))
				continue;

		    $this->writePlugin($pluginNode);
		}
	}

	protected function getEnumPath(DOMElement $enumNode)
	{
		$enumName = $enumNode->getAttribute('name');
		$enumName = preg_replace('/^Vidiun(.+)$/', '$1', $enumName);

		if(!$enumNode->hasAttribute('plugin'))
			return "Vidiun/Client/Enum/{$enumName}.php";

		$pluginName = ucfirst($enumNode->getAttribute('plugin'));
		return "Vidiun/Client/{$pluginName}/Enum/{$enumName}.php";
	}

	protected function getTypePath(DOMElement $classNode)
	{
		$className = $classNode->getAttribute('name');
		$className = preg_replace('/^Vidiun(.+)$/', '$1', $className);

		if(!$classNode->hasAttribute('plugin'))
			return "Vidiun/Client/Type/{$className}.php";

		$pluginName = ucfirst($classNode->getAttribute('plugin'));
		return "Vidiun/Client/{$pluginName}/Type/{$className}.php";
	}

	protected function getServicePath($serviceNode)
	{
		$serviceName = ucfirst($serviceNode->getAttribute('name'));

		if(!$serviceNode->hasAttribute('plugin'))
			return "Vidiun/Client/{$serviceName}Service.php";

		$pluginName = ucfirst($serviceNode->getAttribute('plugin'));
		return "Vidiun/Client/{$pluginName}/{$serviceName}Service.php";
	}

	protected function getPluginPath($pluginName)
	{
		$pluginName = ucfirst($pluginName);
		return "Vidiun/Client/{$pluginName}/Plugin.php";
	}

	protected function getMainPath()
	{
		return 'Vidiun/Client/Client.php';
	}

	protected function getMapPath()
	{
		return 'Vidiun/Client/TypeMap.php';
	}

	protected function getEnumClass($enumName)
	{
		if(!isset($this->cacheTypes[$enumName]))
			return $enumName;

		return $this->cacheTypes[$enumName];
	}

	protected function getTypeClass($className)
	{
		if(!isset($this->cacheTypes[$className]))
			return $className;

		return $this->cacheTypes[$className];
	}

	protected function getServiceClass(DOMElement $serviceNode)
	{
		$serviceName = ucfirst($serviceNode->getAttribute('name'));

		if(!$serviceNode->hasAttribute('plugin'))
			return "Vidiun_Client_{$serviceName}Service";

		$pluginName = ucfirst($serviceNode->getAttribute('plugin'));
		return "Vidiun_Client_{$pluginName}_{$serviceName}Service";
	}

	protected function getPluginClass($pluginName)
	{
		$pluginName = ucfirst($pluginName);
		return "Vidiun_Client_{$pluginName}_Plugin";
	}

	function writePlugin(DOMElement $pluginNode)
	{
		$xpath = new DOMXPath($this->_doc);

		$pluginName = $pluginNode->getAttribute("name");
		$pluginClassName = $this->getPluginClass($pluginName);

    	$this->startNewTextBlock();
		$this->appendLine('<?php');

		if($this->generateDocs)
		{
			$this->appendLine('/**');
			$this->appendLine(" * @package $this->package");
			$this->appendLine(" * @subpackage $this->subpackage");
			$this->appendLine(' */');
		}

		$this->appendLine("class $pluginClassName extends Vidiun_Client_Plugin");
		$this->appendLine('{');

		$serviceNodes = $xpath->query("/xml/services/service[@plugin = '$pluginName']");
//		$serviceNodes = $xpath->query("/xml/plugins/plugin[@name = '$pluginName']/pluginService");
		foreach($serviceNodes as $serviceNode)
		{
			$serviceAttribute = $serviceNode->getAttribute("name");
			$serviceClass = $this->getServiceClass($serviceNode);
			$this->appendLine('	/**');
			$this->appendLine("	 * @var $serviceClass");
			$this->appendLine('	 */');
			$this->appendLine("	public \${$serviceAttribute} = null;");
			$this->appendLine('');
		}

		$this->appendLine('	protected function __construct(Vidiun_Client_Client $client)');
		$this->appendLine('	{');
		$this->appendLine('		parent::__construct($client);');
		foreach($serviceNodes as $serviceNode)
		{
			$serviceAttribute = $serviceNode->getAttribute("name");
			$serviceClass = $this->getServiceClass($serviceNode);
			$this->appendLine("		\$this->$serviceAttribute = new $serviceClass(\$client);");
		}
		$this->appendLine('	}');
		$this->appendLine('');
		$this->appendLine('	/**');
		$this->appendLine("	 * @return $pluginClassName");
		$this->appendLine('	 */');
		$this->appendLine('	public static function get(Vidiun_Client_Client $client)');
		$this->appendLine('	{');
		$this->appendLine("		return new $pluginClassName(\$client);");
		$this->appendLine('	}');
		$this->appendLine('');
		$this->appendLine('	/**');
		$this->appendLine('	 * @return array<Vidiun_Client_ServiceBase>');
		$this->appendLine('	 */');
		$this->appendLine('	public function getServices()');
		$this->appendLine('	{');
		$this->appendLine('		$services = array(');
		foreach($serviceNodes as $serviceNode)
		{
			$serviceAttribute = $serviceNode->getAttribute("name");
			$this->appendLine("			'$serviceAttribute' => \$this->$serviceAttribute,");
		}
		$this->appendLine('		);');
		$this->appendLine('		return $services;');
		$this->appendLine('	}');
		$this->appendLine('');
		$this->appendLine('	/**');
		$this->appendLine('	 * @return string');
		$this->appendLine('	 */');
		$this->appendLine('	public function getName()');
		$this->appendLine('	{');
		$this->appendLine("		return '$pluginName';");
		$this->appendLine('	}');
		$this->appendLine('}');
		$this->appendLine('');

    	$this->addFile($this->getPluginPath($pluginName), $this->getTextBlock());
	}


	function writeEnum(DOMElement $enumNode)
	{
		$enumName = $this->getEnumClass($enumNode->getAttribute('name'));

		if($this->generateDocs)
		{
			$this->appendLine('/**');
			$this->appendLine(" * @package $this->package");
			$this->appendLine(" * @subpackage $this->subpackage");
			$this->appendLine(' */');
		}

	 	$this->appendLine("class $enumName extends Vidiun_Client_EnumBase");
		$this->appendLine("{");
		foreach($enumNode->childNodes as $constNode)
		{
			if ($constNode->nodeType != XML_ELEMENT_NODE)
				continue;

			$propertyName = $constNode->getAttribute("name");
			$propertyValue = $constNode->getAttribute("value");
			if ($enumNode->getAttribute("enumType") == "string")
				$this->appendLine("	const $propertyName = \"$propertyValue\";");
			else
				$this->appendLine("	const $propertyName = $propertyValue;");
		}
		$this->appendLine("}");
		$this->appendLine();
	}

	function writeClass(DOMElement $classNode)
	{
		$vidiunType = $classNode->getAttribute('name');
		$type = $this->getTypeClass($vidiunType);

		$abstract = '';
		if ($classNode->hasAttribute("abstract"))
			$abstract = 'abstract ';

		if($this->generateDocs)
		{
			$this->appendLine('/**');
			$this->appendLine(" * @package $this->package");
			$this->appendLine(" * @subpackage $this->subpackage");
			$this->appendLine(' */');
		}

		// class definition
		$baseClass = 'Vidiun_Client_ObjectBase';
		if ($classNode->hasAttribute('base'))
			$baseClass = $this->getTypeClass($classNode->getAttribute('base'));

		$this->appendLine($abstract . "class $type extends $baseClass");
		$this->appendLine("{");
		$this->appendLine("	public function getVidiunObjectType()");
		$this->appendLine("	{");
		$this->appendLine("		return '$vidiunType';");
		$this->appendLine("	}");
		$this->appendLine("	");

		$this->appendLine('	public function __construct(SimpleXMLElement $xml = null)');
		$this->appendLine('	{');
		$this->appendLine('		parent::__construct($xml);');
		$this->appendLine('		');
		$this->appendLine('		if(is_null($xml))');
		$this->appendLine('			return;');
		$this->appendLine('		');

		foreach($classNode->childNodes as $propertyNode)
		{
			if ($propertyNode->nodeType != XML_ELEMENT_NODE)
				continue;

			$propName = $propertyNode->getAttribute("name");
			$isEnum = $propertyNode->hasAttribute("enumType");
			$propType = $this->getTypeClass($propertyNode->getAttribute("type"));

			switch ($propType)
			{
				case "int" :
				case "float" :
					$this->appendLine("		if(count(\$xml->{$propName}))");
					$this->appendLine("			\$this->$propName = ($propType)\$xml->$propName;");
					break;

				case "bigint" :
					$this->appendLine("		if(count(\$xml->{$propName}))");
					$this->appendLine("			\$this->$propName = (string)\$xml->$propName;");
					break;

				case "bool" :
					$this->appendLine("		if(count(\$xml->{$propName}))");
					$this->appendLine("		{");
					$this->appendLine("			if(!empty(\$xml->{$propName}) && ((int) \$xml->{$propName} === 1 || strtolower((string)\$xml->{$propName}) === 'true'))");
					$this->appendLine("				\$this->$propName = true;");
					$this->appendLine("			else");
					$this->appendLine("				\$this->$propName = false;");
					$this->appendLine("		}");
					break;

				case "string" :
					$this->appendLine("		if(count(\$xml->{$propName}))");
					$this->appendLine("			\$this->$propName = ($propType)\$xml->$propName;");
					break;

				case "array" :
					$arrayType = $propertyNode->getAttribute ( "arrayType" );
					$this->appendLine("		if(count(\$xml->{$propName}))");
					$this->appendLine("		{");
					$this->appendLine("			if(empty(\$xml->{$propName}))");
					$this->appendLine("				\$this->$propName = array();");
					$this->appendLine("			else");
					$this->appendLine("				\$this->$propName = Vidiun_Client_ParseUtils::unmarshalArray(\$xml->$propName, \"$arrayType\");");
					$this->appendLine("		}");
					break;

				case "map" :
					$arrayType = $propertyNode->getAttribute ( "arrayType" );
					$this->appendLine("		if(count(\$xml->{$propName}))");
					$this->appendLine("		{");
					$this->appendLine("			if(empty(\$xml->{$propName}))");
					$this->appendLine("				\$this->$propName = array();");
					$this->appendLine("			else");
					$this->appendLine("				\$this->$propName = Vidiun_Client_ParseUtils::unmarshalMap(\$xml->$propName, \"$arrayType\");");
					$this->appendLine("		}");
					break;

				default : // sub object
					$fallback = $propertyNode->getAttribute("type");
					$this->appendLine("		if(count(\$xml->{$propName}) && !empty(\$xml->{$propName}))");
					$this->appendLine("			\$this->$propName = Vidiun_Client_ParseUtils::unmarshalObject(\$xml->$propName, \"$fallback\");");
					break;
			}


		}

		$this->appendLine('	}');

		// class properties
		foreach($classNode->childNodes as $propertyNode)
		{
			if ($propertyNode->nodeType != XML_ELEMENT_NODE)
				continue;

			$propName = $propertyNode->getAttribute("name");
			$isReadyOnly = $propertyNode->getAttribute("readOnly") == 1;
			$isInsertOnly = $propertyNode->getAttribute("insertOnly") == 1;
			$isEnum = $propertyNode->hasAttribute("enumType");
			$propType = null;
			if ($isEnum)
				$propType = $propertyNode->getAttribute("enumType");
			else
				$propType = $propertyNode->getAttribute("type");
			$propType = $this->getTypeClass($propType);
			$propDescription = $propertyNode->getAttribute("description");

			$this->appendLine("	/**");
			$description = $propDescription;
			$description = str_replace("\n", "\n	 * ", $propDescription); // to format multiline descriptions
			$this->appendLine("	 * " . $description);
			$this->appendLine("	 *");
			if ($propType == "array")
				$this->appendLine("	 * @var $propType of {$propertyNode->getAttribute("arrayType")}");
			else
				$this->appendLine("	 * @var $propType");
			if ($isReadyOnly )
				$this->appendLine("	 * @readonly");
			if ($isInsertOnly)
				$this->appendLine("	 * @insertonly");
			$this->appendLine("	 */");

			$propertyLine =	"public $$propName";

			if ($this->isSimpleType($propType) || $isEnum)
			{
				$propertyLine .= " = null";
			}

			$this->appendLine("	$propertyLine;");
			$this->appendLine("");
		}
		$this->appendLine();

		// close class
		$this->appendLine("}");
		$this->appendLine();
	}

	function writeService(DOMElement $serviceNode)
	{
		$plugin = null;
		if($serviceNode->hasAttribute('plugin'))
			$plugin = $serviceNode->getAttribute('plugin');

		$serviceId = $serviceNode->getAttribute("id");
		$serviceName = $serviceNode->getAttribute("name");

		$serviceClassName = $this->getServiceClass($serviceNode, $plugin);
		$this->appendLine();

		if($this->generateDocs)
		{
			$this->appendLine('/**');
			$this->appendLine(" * @package $this->package");
			$this->appendLine(" * @subpackage $this->subpackage");
			$this->appendLine(' */');
		}

		$this->appendLine("class $serviceClassName extends Vidiun_Client_ServiceBase");
		$this->appendLine("{");
		$this->appendLine("	function __construct(Vidiun_Client_Client \$client = null)");
		$this->appendLine("	{");
		$this->appendLine("		parent::__construct(\$client);");
		$this->appendLine("	}");

		$actionNodes = $serviceNode->childNodes;
		foreach($actionNodes as $actionNode)
		{
		    if ($actionNode->nodeType != XML_ELEMENT_NODE)
				continue;

		    $this->writeAction($serviceId, $serviceName, $actionNode);
		}
		$this->appendLine("}");
	}

	function writeAction($serviceId, $serviceName, DOMElement $actionNode, $plugin = null)
	{
		$action = $actionNode->getAttribute("name");
		if(!$this->shouldIncludeAction($serviceId, $action))
			return;

	    $resultNode = $actionNode->getElementsByTagName("result")->item(0);
	    $resultType = $resultNode->getAttribute("type");
	    $arrayObjectType = ($resultType == 'array') ? $resultNode->getAttribute ( "arrayType" ) : null;

		$enableInMultiRequest = true;
		if($actionNode->hasAttribute("enableInMultiRequest"))
		{
			$enableInMultiRequest = intval($actionNode->getAttribute("enableInMultiRequest"));
		}

		$returnType = $this->getTypeClass($resultType);

		// method signature
		$signature = "";
		if (in_array($action, array("list", "clone", "goto"))) // because list & clone are preserved in PHP
			$signature .= "function ".$action."Action(";
		else
			$signature .= "function ".$action."(";

		$paramNodes = $actionNode->getElementsByTagName("param");
		$signature .= $this->getSignature($paramNodes);

		$this->appendLine();
		$this->appendLine("	/**");
		$this->appendLine("	 * @return $returnType");
		$this->appendLine("	 * @throws Vidiun_Client_Exception|Vidiun_Client_ClientException");
		$this->appendLine("	 */");
		$this->appendLine("	$signature");
		$this->appendLine("	{");

		if(!$enableInMultiRequest)
		{
			$this->appendLine("		if (\$this->client->isMultiRequest())");
			$this->appendLine("			throw \$this->client->getVidiunClientException(\"Action is not supported as part of multi-request.\", Vidiun_Client_ClientException::ERROR_ACTION_IN_MULTIREQUEST);");
			$this->appendLine("		");
		}

		$this->appendLine("		\$vparams = array();");
		$haveFiles = false;
		foreach($paramNodes as $paramNode)
		{
			$paramType = $paramNode->getAttribute("type");
		    $paramName = $paramNode->getAttribute("name");
		    $isEnum = $paramNode->hasAttribute("enumType");
		    $isOptional = $paramNode->getAttribute("optional");

		    if ($haveFiles === false && $paramType == "file")
	    	{
		        $haveFiles = true;
	        	$this->appendLine("		\$vfiles = array();");
	    	}

			if (!$this->isSimpleType($paramType))
			{
				if ($isEnum)
				{
					$this->appendLine("		\$this->client->addParam(\$vparams, \"$paramName\", \$$paramName);");
				}
				else if ($paramType == "file")
				{
					$this->appendLine("		\$this->client->addParam(\$vfiles, \"$paramName\", \$$paramName);");
				}
				else if ($paramType == "array")
				{
					$extraTab = "";
					if ($isOptional)
					{
						$this->appendLine("		if (\$$paramName !== null)");
						$extraTab = "	";
					}
					$this->appendLine("$extraTab		foreach(\$$paramName as \$index => \$obj)");
					$this->appendLine("$extraTab		{");
					$this->appendLine("$extraTab			\$this->client->addParam(\$vparams, \"$paramName:\$index\", \$obj->toParams());");
					$this->appendLine("$extraTab		}");
				}
				else
				{
					$extraTab = "";
					if ($isOptional)
					{
						$this->appendLine("		if (\$$paramName !== null)");
						$extraTab = "	";
					}
					$this->appendLine("$extraTab		\$this->client->addParam(\$vparams, \"$paramName\", \$$paramName"."->toParams());");
				}
			}
			else
			{
				$this->appendLine("		\$this->client->addParam(\$vparams, \"$paramName\", \$$paramName);");
			}
		}

	    if($resultType == 'file')
	    {
			$this->appendLine("		\$this->client->queueServiceActionCall('" . strtolower($serviceId) . "', '$action', null, \$vparams);");
			$this->appendLine('		$resultObject = $this->client->getServeUrl();');
	    }
	    else
	    {
	    	$fallbackClass = 'null';
	    	if($resultType == 'array')
	    	{
	    		$fallbackClass = "\"$arrayObjectType\"";
	    	}
	    	else if($resultType && !$this->isSimpleType($resultType))
	    	{
	    		$fallbackClass = "\"$resultType\"";
	    	}

			if ($haveFiles)
			{
				$this->appendLine("		\$this->client->queueServiceActionCall(\"".strtolower($serviceId)."\", \"$action\",  $fallbackClass, \$vparams, \$vfiles);");
			}
			else
			{
				$this->appendLine("		\$this->client->queueServiceActionCall(\"".strtolower($serviceId)."\", \"$action\", $fallbackClass, \$vparams);");
			}

			if($enableInMultiRequest)
			{
				$this->appendLine("		if (\$this->client->isMultiRequest())");
				$this->appendLine("			return \$this->client->getMultiRequestResult();");
			}

			$this->appendLine("		\$resultXml = \$this->client->doQueue();");
			$this->appendLine("		\$resultXmlObject = new \\SimpleXMLElement(\$resultXml);");
			$this->appendLine("		\$this->client->checkIfError(\$resultXmlObject->result);");

			switch($resultType)
			{
				case 'int':
					$this->appendLine("		\$resultObject = (int)Vidiun_Client_ParseUtils::unmarshalSimpleType(\$resultXmlObject->result);");
					break;

				case 'bool':
					$this->appendLine("		\$resultObject = (bool)Vidiun_Client_ParseUtils::unmarshalSimpleType(\$resultXmlObject->result);");
					break;
				case 'bigint':
				case 'string':
					$this->appendLine("		\$resultObject = (string)Vidiun_Client_ParseUtils::unmarshalSimpleType(\$resultXmlObject->result);");
					break;
				case 'array':
					$this->appendLine("		\$resultObject = Vidiun_Client_ParseUtils::unmarshalArray(\$resultXmlObject->result, \"$arrayObjectType\");");
					$arrayObjectType = $this->getTypeClass($arrayObjectType);
					$this->appendLine("		foreach(\$resultObject as \$resultObjectItem){");
					$this->appendLine("			\$this->client->validateObjectType(\$resultObjectItem, \"$arrayObjectType\");");
					$this->appendLine("		}");
					break;

				default:
					if ($resultType)
					{
						$this->appendLine("		\$resultObject = Vidiun_Client_ParseUtils::unmarshalObject(\$resultXmlObject->result, \"$resultType\");");
						$this->appendLine("		\$this->client->validateObjectType(\$resultObject, \"$returnType\");");
					}
			}
	    }

		if($resultType && $resultType != 'null')
		{
			$this->appendLine("		return \$resultObject;");
		}

		$this->appendLine("	}");
	}

	function getSignature($paramNodes, $plugin = null)
	{
		$signature = "";
		foreach($paramNodes as $paramNode)
		{
			$paramName = $paramNode->getAttribute("name");
			$paramType = $paramNode->getAttribute("type");
			$defaultValue = $paramNode->getAttribute("default");

			if ($this->isSimpleType($paramType) || $paramType == "file")
			{
				$signature .= "$".$paramName;
			}
			else if ($paramType == "array" || $paramType == "map")
			{
				$signature .= "array $".$paramName;
			}
			else
			{
				$typeClass = $this->getTypeClass($paramType);
				$signature .= $typeClass." $".$paramName;
			}


			if ($paramNode->getAttribute("optional"))
			{
				if ($this->isSimpleType($paramType))
				{
					if ($defaultValue === "false")
						$signature .= " = false";
					else if ($defaultValue === "true")
						$signature .= " = true";
					else if ($defaultValue === "null")
						$signature .= " = null";
					else if ($paramType == "string")
						$signature .= " = \"$defaultValue\"";
					else if ($paramType == "int" || $paramType == "bigint" || $paramType == "float")
					{
						if ($defaultValue == "")
							$signature .= " = \"\""; // hack for partner.getUsage
						else
							$signature .= " = $defaultValue";
					}
				}
				else
					$signature .= " = null";
			}

			$signature .= ", ";
		}
		if ($this->endsWith($signature, ", "))
			$signature = substr($signature, 0, strlen($signature) - 2);
		$signature .= ")";

		return $signature;
	}

	function writeMainClient(DOMNodeList $serviceNodes, DOMNodeList $configurationNodes)
	{
		$mainClassName = 'Vidiun_Client_Client';
		$apiVersion = $this->_doc->documentElement->getAttribute('apiVersion');
		$date = date('y-m-d');

		if($this->generateDocs)
		{
			$this->appendLine('/**');
			$this->appendLine(" * @package $this->package");
			$this->appendLine(" * @subpackage $this->subpackage");
			$this->appendLine(' */');
		}

		$this->appendLine("class $mainClassName extends Vidiun_Client_ClientBase");
		$this->appendLine("{");

		foreach($serviceNodes as $serviceNode)
		{
			if(!$this->shouldIncludeService($serviceNode->getAttribute("id")))
				continue;

			if($serviceNode->hasAttribute("plugin"))
				continue;

			$serviceName = $serviceNode->getAttribute("name");
			$description = $serviceNode->getAttribute("description");
			$serviceClassName = "Vidiun_Client_".ucfirst($serviceName)."Service";
			$this->appendLine("	/**");
			$description = str_replace("\n", "\n	 * ", $description); // to format multiline descriptions
			$this->appendLine("	 * " . $description);
			$this->appendLine("	 * @var $serviceClassName");
			$this->appendLine("	 */");
			$this->appendLine("	public \$$serviceName = null;");
			$this->appendLine("");
		}

		$this->appendLine("	/**");
		$this->appendLine("	 * Vidiun client constructor");
		$this->appendLine("	 *");
		$this->appendLine("	 * @param Vidiun_Client_Configuration \$config");
		$this->appendLine("	 */");
		$this->appendLine("	public function __construct(Vidiun_Client_Configuration \$config)");
		$this->appendLine("	{");
		$this->appendLine("		parent::__construct(\$config);");
		$this->appendLine("		");
		$this->appendLine("		\$this->setClientTag('php5:$date');");
		$this->appendLine("		\$this->setApiVersion('$apiVersion');");
		$this->appendLine("		");

		foreach($serviceNodes as $serviceNode)
		{
			if(!$this->shouldIncludeService($serviceNode->getAttribute("id")))
				continue;

			if($serviceNode->hasAttribute("plugin"))
				continue;

			$serviceName = $serviceNode->getAttribute("name");
			$serviceClassName = "Vidiun_Client_".ucfirst($serviceName)."Service";
			$this->appendLine("		\$this->$serviceName = new $serviceClassName(\$this);");
		}
		$this->appendLine("	}");
		$this->appendLine("	");

		$volatileProperties = array();
		foreach($configurationNodes as $configurationNode)
		{
			/* @var $configurationNode DOMElement */
			$configurationName = $configurationNode->nodeName;
			$attributeName = lcfirst($configurationName) . "Configuration";
			$volatileProperties[$attributeName] = array();

			foreach($configurationNode->childNodes as $configurationPropertyNode)
			{
				/* @var $configurationPropertyNode DOMElement */

				if ($configurationPropertyNode->nodeType != XML_ELEMENT_NODE)
					continue;

				$configurationProperty = $configurationPropertyNode->localName;

				if($configurationPropertyNode->hasAttribute('volatile') && $configurationPropertyNode->getAttribute('volatile'))
				{
					$volatileProperties[$attributeName][] = $configurationProperty;
				}

				$type = $this->getTypeClass($configurationPropertyNode->getAttribute('type'));
				$description = null;

				if($configurationPropertyNode->hasAttribute('description'))
				{
					$description = $configurationPropertyNode->getAttribute('description');
				}

				$this->writeConfigurationProperty($configurationName, $configurationProperty, $configurationProperty, $type, $description);

				if($configurationPropertyNode->hasAttribute('alias'))
				{
					$this->writeConfigurationProperty($configurationName, $configurationPropertyNode->getAttribute('alias'), $configurationProperty, $type, $description);
				}
			}
		}

		$this->appendLine ( "	/**");
		$this->appendLine ( "	 * Clear all volatile configuration parameters");
		$this->appendLine ( "	 */");
		$this->appendLine ( "	protected function resetRequest()");
		$this->appendLine ( "	{");
		$this->appendLine ( "		parent::resetRequest();");
		foreach($volatileProperties as $attributeName => $properties)
		{
			foreach($properties as $propertyName)
			{
				$this->appendLine("		unset(\$this->{$attributeName}['{$propertyName}']);");
			}
		}
		$this->appendLine ( "	}");

		$this->appendLine("}");
	}

	protected function writeConfigurationProperty($configurationName, $name, $paramName, $type, $description)
	{
		$methodsName = ucfirst($name);
		$signitureType = $this->isSimpleType($type) ? '' : "$type ";


		$this->appendLine("	/**");
		if($description)
		{
			$this->appendLine("	 * $description");
			$this->appendLine("	 * ");
		}
		$this->appendLine("	 * @param $type \${$name}");
		$this->appendLine("	 */");
		$this->appendLine("	public function set{$methodsName}({$signitureType}\${$name})");
		$this->appendLine("	{");
		$this->appendLine("		\$this->{$configurationName}Configuration['{$paramName}'] = \${$name};");
		$this->appendLine("	}");
		$this->appendLine("	");


		$this->appendLine("	/**");
		if($description)
		{
			$this->appendLine("	 * $description");
			$this->appendLine("	 * ");
		}
		$this->appendLine("	 * @return $type");
		$this->appendLine("	 */");
		$this->appendLine("	public function get{$methodsName}()");
		$this->appendLine("	{");
		$this->appendLine("		if(isset(\$this->{$configurationName}Configuration['{$paramName}']))");
		$this->appendLine("		{");
		$this->appendLine("			return \$this->{$configurationName}Configuration['{$paramName}'];");
		$this->appendLine("		}");
		$this->appendLine("		");
		$this->appendLine("		return null;");
		$this->appendLine("	}");
		$this->appendLine("	");
	}

	protected function addFile($fileName, $fileContents, $addLicense = true)
	{
		$patterns = array(
			'/@package\s+.+/',
			'/@subpackage\s+.+/',
		);
		$replacements = array(
			'@package ' . $this->package,
			'@subpackage ' . $this->subpackage,
		);
		$fileContents = preg_replace($patterns, $replacements, $fileContents);
		parent::addFile($fileName, $fileContents, $addLicense);
	}
}
