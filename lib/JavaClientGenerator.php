<?php
/**
 * This is a port of Vidiun's DotNetClientGenerator to Java.
 * 8/2009
 * jpotts, Optaros
 * 1/2010
 * oferc
 */

class JavaClientGenerator extends ClientGeneratorFromXml 
{
	private $_csprojIncludes = array ();
	protected $_baseClientPath = "src/main/java/com/vidiun/client";
	protected $_usePrivateAttributes;
	
	function __construct($xmlPath, Zend_Config $config, $sourcePath = "java")
	{
		parent::__construct($xmlPath, $sourcePath, $config);
		$this->_usePrivateAttributes = isset($config->usePrivateAttributes) ? $config->usePrivateAttributes : false;
	}
	
	function getSingleLineCommentMarker()
	{
		return '//';
	}
	
	public function generate() 
	{
		parent::generate();
		
		$xpath = new DOMXPath ( $this->_doc );
		$enumNodes = $xpath->query ( "/xml/enums/enum" );
		foreach ( $enumNodes as $enumNode ) 
		{
			$this->writeEnum ( $enumNode );
		}
		
		$classNodes = $xpath->query ( "/xml/classes/class" );
		foreach ( $classNodes as $classNode ) 
		{
			$this->writeClass ( $classNode );
		}
		
		$serviceNodes = $xpath->query ( "/xml/services/service" );		
		foreach ( $serviceNodes as $serviceNode ) 
		{
			$this->writeService ( $serviceNode );
		}
		
		$configurationNodes = $xpath->query("/xml/configurations/*");
	    $this->writeMainClient($serviceNodes, $configurationNodes);
	}
	
	//Private functions
	/////////////////////////////////////////////////////////////
	private function addDescription($propertyNode, $prefix) {
		
		if($propertyNode->hasAttribute ( "description" ))
		{
			$desc = $propertyNode->getAttribute ( "description" );
			$desc = str_replace(array("&", "<", ">"), array("&amp;", "&lt;", "&gt;"), $desc);
			$formatDesc = wordwrap(str_replace(array("\t", "\n", "\r"), " ", $desc) , 80, "\n" . $prefix . "  ");
			if($desc)
				return ( $prefix . "/**  $formatDesc  */" );
		}
		return "";
	}
	
	function writeEnum(DOMElement $enumNode) 
	{
		$enumName = $enumNode->getAttribute ( "name" );
		if(!$this->shouldIncludeType($enumName))
			return;
		
		$enumType = $enumNode->getAttribute ( "enumType" );
		$baseInterface = ($enumType == "string") ? "VidiunEnumAsString" : "VidiunEnumAsInt";
		
		$str = "";
		$str = "package com.vidiun.client.enums;\n";
		$str .= "\n";
		$str .= $this->getBanner ();
		
		$desc = $this->addDescription($enumNode, "");
		if($desc)
			$str .= $desc . "\n";
		$str .= "public enum $enumName implements $baseInterface {\n";
		
		// Print enum values
		$enumCount = $this->generateEnumValues($enumNode, $str);
		
		// Generate hash code function
		$this->generateEnumHashCodeFunctions($str, $enumType, $enumName);
		
		// Generate get function if needed
		if($enumCount) 
		{
			$this->generateEnumGetFunction($str, $enumNode, $enumType,  $enumName);
		}
		else 
		{
			$this->generateEmptyEnumGetFunction($str, $enumNode, $enumType,  $enumName);
		}
		
		$str .= "}\n";
		$file = $this->_baseClientPath . "/enums/$enumName.java";
		$this->addFile ( $file, $str );
	}
	
	function generateEnumValues($enumNode, &$str)
	{
		$enumType = $enumNode->getAttribute ( "enumType" );
		$enumCount = 0;
		$enumValues = array();
		$processedValues = array();
		
		foreach ( $enumNode->childNodes as $constNode )
		{
			if ($constNode->nodeType != XML_ELEMENT_NODE)
				continue;
				
			$propertyName = $constNode->getAttribute ( "name" );
			$propertyValue = $constNode->getAttribute ( "value" );
			
			if (in_array($propertyValue, $processedValues))
				continue;			// Java does not allow duplicate values in enums
			$processedValues[] = $propertyValue;
			
			if ($enumType == "string")
			{
				$propertyValue = "\"" . $propertyValue . "\"";
			}
			$enumValues[] = "$propertyName ($propertyValue)";
		}
		
		if(count($enumValues) == 0)
			$str .= "    /** Place holder for future values */";
		else  {
			$enums = implode(",\n    ", $enumValues);
			$str .= "    $enums";
		}
		
		$str .= ";\n\n";
		return count($enumValues);
	}
	
	function generateEnumHashCodeFunctions(&$str, $enumType, $enumName)
	{
		$type = 'int';
		if ($enumType == "string"){
			$type = 'String';
		}
		
		$visibility = 'public';
		if($this->_usePrivateAttributes){
			$visibility = 'private';
		}
		
		$str .= "    $visibility $type hashCode;\n\n";
		$str .= "    $enumName($type hashCode) {\n";
		$str .= "        this.hashCode = hashCode;\n";
		$str .= "    }\n\n";
		$str .= "    public $type getHashCode() {\n";
		$str .= "        return this.hashCode;\n";
		$str .= "    }\n\n";
		$str .= "    public void setHashCode($type hashCode) {\n";
		$str .= "        this.hashCode = hashCode;\n";
		$str .= "    }\n\n";
	}
		
	function generateEmptyEnumGetFunction(&$str, $enumNode, $enumType,  $enumName) 
	{
		$str .= "    public static $enumName get(String hashCode) {\n";
		$str .= "    	return null;\n";
		$str .= "    }\n";
	}
		
	function generateEnumGetFunction(&$str, $enumNode, $enumType,  $enumName) 
	{
		if ($enumType == "string")
		{
			$str .= "    public static $enumName get(String hashCode) {\n";
		} else
		{
			$str .= "    public static $enumName get(int hashCode) {\n";
			$str .= "        switch(hashCode) {\n";
		}

		$processedValues = array();
		
		$defaultPropertyName = "";
		foreach ( $enumNode->childNodes as $constNode )
		{
			if ($constNode->nodeType != XML_ELEMENT_NODE)
				continue;
	
			$propertyName = $constNode->getAttribute ( "name" );
			$propertyValue = $constNode->getAttribute ( "value" );
			
			if (in_array($propertyValue, $processedValues))
				continue;			// Java does not allow duplicate values in enums
			$processedValues[] = $propertyValue;
			
			if ($defaultPropertyName == "")
				$defaultPropertyName = $propertyName;
	
			if ($enumType == "string")
			{
				$propertyValue = "\"" . $propertyValue . "\"";
				$str .= "        if (hashCode.equals({$propertyValue}))\n";
				$str .= "        {\n";
				$str .= "           return {$propertyName};\n";
				$str .= "        }\n";
				$str .= "        else \n";
			}
			else
			{
				$str .= "            case $propertyValue: return $propertyName;\n";
			}
		}
			
		if ($enumType == "string")
		{
			$str .= "        {\n";
			$str .= "           return {$defaultPropertyName};\n";
			$str .= "        }\n";
		}
		else
		{
			$str .= "            default: return $defaultPropertyName;\n";
			$str .= "        }\n";
		}
		$str .= "    }\n";
	}
	
	function writeClass(DOMElement $classNode) 
	{
		$type = $classNode->getAttribute ( "name" );
		if(!$this->shouldIncludeType($type))
			return;
		
		// File name
		$file = $this->_baseClientPath . "/types/$type.java";
		
		// Basic imports
		$imports = "";
		$imports .= "package com.vidiun.client.types;\n\n";
		$imports .= "import org.w3c.dom.Element;\n";
		$imports .= "import com.vidiun.client.VidiunParams;\n";
		$imports .= "import com.vidiun.client.VidiunApiException;\n";

		// Add Banner
		$this->startNewTextBlock ();
		$this->appendLine ( "" );
		$this->appendLine ( $this->getBanner () );
		
		$desc = $this->addDescription($classNode, "");
		if($desc)
			$this->appendLine ( $desc );
		
		// class definition
		$abstract = '';
		if ($classNode->hasAttribute("abstract"))
			$abstract = ' abstract';
		
		$needsSuperConstructor = false;
		$this->appendLine ( '@SuppressWarnings("serial")' );
		if ($classNode->hasAttribute ( "base" )) 
		{
			$this->appendLine ( "public{$abstract} class $type extends " . $classNode->getAttribute ( "base" ) . " {" );
			$needsSuperConstructor = true;
		} 
		else 
		{
			$imports .= "import com.vidiun.client.VidiunObjectBase;\n";
			$this->appendLine ( "public{$abstract} class $type extends VidiunObjectBase {" );
		}
		
		// Generate parameters declaration
		$this->generateParametersDeclaration ( $imports, $classNode);
		$this->appendLine ( "" );
		
		// Generate empty constructor
		$this->appendLine ( "    public $type() {" );
		$this->appendLine ( "    }" );
		$this->appendLine ( "" );
		
		// Generate Full constructor
		$this->generateFullConstructor ( $imports , $classNode, $needsSuperConstructor);
		$this->appendLine ( "" );

		// Generate to params method
		$this->generateToParamsMethod ($classNode);
		$this->appendLine ( "" );
		
		// close class
		$this->appendLine ( "}" );
		$this->appendLine ();
		
		$this->addFile ( $file, $imports . "\n" . $this->getTextBlock () );
	}
	
	public function generateParametersDeclaration(&$imports, $classNode) {

		$needsArrayList = false;
		$needsHashMap = false;
		$arrImportsEnums = array();
		$arrFunctions = array();

		foreach ( $classNode->childNodes as $propertyNode ) 
		{
			if ($propertyNode->nodeType != XML_ELEMENT_NODE)
				continue;
			
			$propName = $propertyNode->getAttribute ( "name" );
			$propType = $propertyNode->getAttribute ( "type" );
			$isEnum = $propertyNode->hasAttribute ( "enumType" );
			
			$javaType = $this->getJavaType($propertyNode);

			if ($isEnum) 
				$arrImportsEnums[] = $javaType; 
			
			if ($propType == "array")
				$needsArrayList = true;
			
			if ($propType == "map")
				$needsHashMap = true;
				
			if ($propType == "VidiunObjectBase")
				$imports.= "import com.vidiun.client.VidiunObjectBase;\n";
						
			if($this->_usePrivateAttributes){
				$propertyLine = "private";
				
				$functionName = ucfirst($propName);
				$arrFunctions[] = "    public $javaType get{$functionName}(){";
				$arrFunctions[] = "        return this.$propName;";
				$arrFunctions[] = "    }";
				$arrFunctions[] = "    ";
				$arrFunctions[] = "    public void set{$functionName}($javaType $propName){";
				$arrFunctions[] = "        this.$propName = $propName;";
				$arrFunctions[] = "    }";
			}
			else{
				$propertyLine = "public";
			}
			
			$propertyLine .= " $javaType $propName";
			
			$initialValue = $this->getInitialPropertyValue($propertyNode);
			if ($initialValue != "") 
				$propertyLine .= " = " . $initialValue;
			
			$desc = $this->addDescription($propertyNode,"\t");
			if($desc)
				$this->appendLine ( $desc );
			
			$this->appendLine ( "    $propertyLine;" );
		}
		
		foreach($arrFunctions as $arrFunctionsLine){		
			$this->appendLine($arrFunctionsLine);
		}
		
		$arrImportsEnums = array_unique($arrImportsEnums);
		foreach($arrImportsEnums as $import) 
			$imports.= "import com.vidiun.client.enums.$import;\n";
		
		if ($needsArrayList)
			$imports .= "import java.util.ArrayList;\n";
		if ($needsHashMap)
			$imports .= "import java.util.HashMap;\n";
	}
	
	public function generateToParamsMethod($classNode) 
	{	
		$type = $classNode->getAttribute ( "name" );
		$this->appendLine ( "    public VidiunParams toParams() throws VidiunApiException {" );
		$this->appendLine ( "        VidiunParams vparams = super.toParams();" );
		$this->appendLine ( "        vparams.add(\"objectType\", \"$type\");" );
		
		foreach ( $classNode->childNodes as $propertyNode ) 
		{
			if ($propertyNode->nodeType != XML_ELEMENT_NODE)
				continue;
			
			$propReadOnly = $propertyNode->getAttribute ( "readOnly" );
			if ($propReadOnly == "1")
				continue;
			
			$propType = $propertyNode->getAttribute ( "type" );
			$propName = $propertyNode->getAttribute ( "name" );
			$this->appendLine ( "        vparams.add(\"$propName\", this.$propName);" );
		}
		$this->appendLine ( "        return vparams;" );
		$this->appendLine ( "    }" );
	}

	public function generateFullConstructor(&$imports, $classNode, $needsSuperConstructor) 
	{	
		$type = $classNode->getAttribute ( "name" );
		$this->appendLine ( "    public $type(Element node) throws VidiunApiException {" );
		$this->appendLine ( "        super(node);" );
			
		if ($classNode->childNodes->length) 
		{
			$imports .= "import com.vidiun.client.utils.ParseUtils;\n";
			$imports .= "import org.w3c.dom.Node;\n";
			$imports .= "import org.w3c.dom.NodeList;\n";
			
			$this->appendLine ( "        NodeList childNodes = node.getChildNodes();" );
			$this->appendLine ( "        for (int i = 0; i < childNodes.getLength(); i++) {" );
			$this->appendLine ( "            Node aNode = childNodes.item(i);" );
//			$this->appendLine ( "            if(aNode.getChildNodes().getLength() == 0){" );
//			$this->appendLine ( "            	continue;" );
//			$this->appendLine ( "            }" );
			$this->appendLine ( "            String nodeName = aNode.getNodeName();" );
			$propBlock = "            ";
			
			$isFirst = true;
			$txtIsUsed = false;

			foreach ( $classNode->childNodes as $propertyNode ) 
			{
				if ($propertyNode->nodeType != XML_ELEMENT_NODE)
					continue;
				
				$propName = $propertyNode->getAttribute ( "name" );
			
				if($isFirst) {
					$isFirst = false;
				} else { 
					$propBlock .= "else ";
				}
				$propBlock .= "if (nodeName.equals(\"$propName\")) {\n";
				$propBlock .= "                ";
				$this->handleSinglePropByType ( $propertyNode , $propBlock, $txtIsUsed);
				$propBlock .= "                continue;\n";
				$propBlock .= "            } ";
			}
			
			if($txtIsUsed) 
				$this->appendLine ( "            String txt = aNode.getTextContent();" );
			
			$this->appendLine ( $propBlock );
			$this->appendLine ( "        }" );
		}
		$this->appendLine ( "    }" );
	}

	/**
	 * @param propType
	 */
	public function handleSinglePropByType($propertyNode, &$propBlock, &$txtIsUsed) {
		
		$propType = $propertyNode->getAttribute ( "type" );
		$propName = $propertyNode->getAttribute ( "name" );
		$isEnum = $propertyNode->hasAttribute ( "enumType" );
		$propBlock .= "this.$propName = ";
		
		switch ($propType) 
		{
			case "bigint" :
			case "time" :
			case "int" :
			case "string" :
			case "bool" :
			case "float" :
				if ( $propType == "float" )
				{
					$propType = "double";
				}
				if ( $propType == "time" )
				{
					$propType = "bigint";
				}

				$txtIsUsed = true;
				$parsedProperty = "ParseUtils.parse".ucfirst($propType)."(txt)";
				if ($isEnum) 
				{
					$enumType = $propertyNode->getAttribute ( "enumType" );
					$propBlock .= "$enumType.get($parsedProperty);\n";
				} 
				else
				{
					$propBlock .= "$parsedProperty;\n";
				}
				break;
				
			case "array" :
				$arrayType = $propertyNode->getAttribute ( "arrayType" );
				$propBlock .= "ParseUtils.parseArray($arrayType.class, aNode);\n";
				break;
				
			case "map" :
				$arrayType = $propertyNode->getAttribute ( "arrayType" );
				$propBlock .= "ParseUtils.parseMap($arrayType.class, aNode);\n";
				break;
				
			default : // sub object
				$propBlock .= "ParseUtils.parseObject($propType.class, aNode);\n";
				break;
		}
	}

	function writeService(DOMElement $serviceNode) 
	{
		$serviceId = $serviceNode->getAttribute ( "id" );
		if(!$this->shouldIncludeService($serviceId))
			return;

		$imports = "";
		$imports .= "package com.vidiun.client.services;\n\n";
		$imports .= "import com.vidiun.client.VidiunClient;\n";
		$imports .= "import com.vidiun.client.VidiunServiceBase;\n";
		$serviceName = $serviceNode->getAttribute ( "name" );
		
		$javaServiceName = $this->upperCaseFirstLetter ( $serviceName ) . "Service";
		$javaServiceType = "Vidiun" . $javaServiceName;
		
		$this->startNewTextBlock ();
		$this->appendLine ();
		$this->appendLine ( $this->getBanner () );
		$desc = $this->addDescription($serviceNode, "");
		if($desc)
			$this->appendLine ( $desc );
		
		$this->appendLine ( '@SuppressWarnings("serial")' );
		$this->appendLine ( "public class $javaServiceType extends VidiunServiceBase {" );
		$this->appendLine ( "    public $javaServiceType(VidiunClient client) {" );
		$this->appendLine ( "        this.vidiunClient = client;" );
		$this->appendLine ( "    }" );
		
		$actionNodes = $serviceNode->childNodes;
		$serviceImports = array();
		
		foreach ( $actionNodes as $actionNode ) 
		{
			if ($actionNode->nodeType != XML_ELEMENT_NODE) 
				continue;
			
			$this->writeAction ( $serviceId, $actionNode, $serviceImports);
		}
		$this->appendLine ( "}" );
		
		// Update imports
		$serviceImports = array_unique($serviceImports);
		foreach($serviceImports as $import) 
			$imports .= "import $import;\n";
		
		$file = $this->_baseClientPath . "/services/" . $javaServiceType . ".java";
		$this->addFile ( $file, $imports . $this->getTextBlock () );
	}
	
	function writeAction($serviceId, DOMElement $actionNode, &$serviceImports) 
	{
		$action = $actionNode->getAttribute ( "name" );
		if(!$this->shouldIncludeAction($serviceId, $action))
			return;
		
		$action = $this->replaceReservedWords($action);
		
		$resultNode = $actionNode->getElementsByTagName ( "result" )->item ( 0 );
		$resultType = $resultNode->getAttribute ( "type" );
		
		$arrayType = '';
		$fallbackClass = null;
		if ($resultType == "array" || $resultType == "map") {
			$arrayType = $resultNode->getAttribute ( "arrayType" );
			$fallbackClass = $arrayType;
		}
    	else if($resultType && ($resultType != 'file') && !$this->isSimpleType($resultType))
    		$fallbackClass = $resultType;
		
	  	$javaOutputType = $this->getResultType($resultType, $arrayType, $serviceImports);
		
		$signaturePrefix = "public $javaOutputType " . $action . "(";
		
		$paramNodes = $actionNode->getElementsByTagName ( "param" );
		$paramNodesArr = array();
		foreach ( $paramNodes as $paramNode ) 
		{
			$paramNodesArr[] = $paramNode;
		}
		
		$this->writeActionOverloads($signaturePrefix, $action, $resultType, $paramNodesArr, $serviceImports);
		
		$signature = $this->getSignature ( $paramNodesArr , array('' => 'VidiunFile'), $serviceImports);
		
		$this->appendLine ();
		
		$desc = $this->addDescription($actionNode, "\t");
		if($desc)
			$this->appendLine ( $desc );
		$this->appendLine ( "    $signaturePrefix$signature throws VidiunApiException {" );
		
		$this->generateActionBodyServiceCall($serviceId, $action, $paramNodesArr, $serviceImports, $fallbackClass);
				
		if($resultType == 'file')
		{
			$this->appendLine ( "        return this.vidiunClient.serve();");
		}
		else
		{
			$serviceImports[] = "org.w3c.dom.Element";
			
			// Handle multi request
			$this->appendLine ( "        if (this.vidiunClient.isMultiRequest())" );
			$defaultValue = $this->getDefaultValue($resultType);
			$this->appendLine ( "            return $defaultValue;" );
						
			// Queue request
			if ($resultType)
				$this->appendLine ( "        Element resultXmlElement = this.vidiunClient.doQueue();" );
			else 
				$this->appendLine ( "        this.vidiunClient.doQueue();" );
			
			// Handle result type
			if ($resultType) 
				$this->handleResultType($resultType, $arrayType, $serviceImports);
		}
		
		$this->appendLine ( "    }" );
		
		$serviceImports[] = "com.vidiun.client.VidiunParams";
		$serviceImports[] = "com.vidiun.client.VidiunApiException";
	}

	public function writeActionOverloads($signaturePrefix, $action, $resultType, $paramNodes, &$serviceImports)
	{
		$returnStmt = '';
		if ($resultType)
			$returnStmt = 'return ';
			
		// split the parameters into mandatory and optional
		$mandatoryParams = array ();
		$optionalParams = array ();
		foreach ( $paramNodes as $paramNode ) 
		{
			$optional = $paramNode->getAttribute ( "optional" );
			if ($optional == "1")
				$optionalParams [] = $paramNode;
			else
				$mandatoryParams [] = $paramNode;
		}
		
		for($overloadNumber = 0; $overloadNumber < count ( $optionalParams ) + 1; $overloadNumber ++) 
		{
			$prototypeParams = array_slice ( $paramNodes, 0, count ( $mandatoryParams ) + $overloadNumber );
			$callParams = array_slice ( $paramNodes, 0, count ( $mandatoryParams ) + $overloadNumber + 1 );
			
			// find which file overloads need to be generated
			$hasFiles = false;
			foreach ($prototypeParams as $paramNode)
			{
				if ($paramNode->getAttribute ( "type" ) == "file")
					$hasFiles = true;
			}

			if ($hasFiles)
			{
				$fileOverloads = array(    
					array('' => 'VidiunFile'),
					array('' => 'File'),
					array('' => 'InputStream', 'Name' => 'String', 'Size' => 'long'),
					array('' => 'FileInputStream', 'Name' => 'String'),
				);
			}
			else
			{
				$fileOverloads = array(
					array('' => 'VidiunFile'),
				);
			}

			foreach ($fileOverloads as $fileOverload)
			{
				if (reset($fileOverload) == 'VidiunFile' && $overloadNumber == count($optionalParams))
					continue;			// this is the main overload
				
				// build the function prototype
				$signature = $this->getSignature ( $prototypeParams, $fileOverload, $serviceImports);
								
				// build the call parameters
				$params = array();
				foreach ( $callParams as $paramNode ) 
				{
					$optional = $paramNode->getAttribute ( "optional" );
					$paramName = $paramNode->getAttribute ( "name" );
					$paramType = $paramNode->getAttribute ( "type" );
					
					if ($optional == "1" && ! in_array ( $paramNode, $prototypeParams, true )) 
					{
						$params[] = $this->getDefaultParamValue($paramNode);
						continue;
					} 
						
					if ($paramType != "file" || reset($fileOverload) == 'VidiunFile')
					{
						$params[] = $paramName;
						continue;
					}
					
					$fileParams = array();
					foreach ($fileOverload as $namePostfix => $paramType)
					{
						$fileParams[] = $paramName . $namePostfix;
					}
					$params[] = "new VidiunFile(" . implode(', ', $fileParams) . ")";
				}				
				$paramsStr = implode(', ', $params);
				
				// write the result
				$this->appendLine ();
				$this->appendLine ( "    $signaturePrefix$signature throws VidiunApiException {" );
				$this->appendLine ( "        {$returnStmt}this.$action($paramsStr);" );
				$this->appendLine ( "    }" );
			}
		}
	}
	
	public function generateActionBodyServiceCall($serviceId, $action, $paramNodes, &$serviceImports, $fallbackClass) 
	{
		$this->appendLine ( "        VidiunParams vparams = new VidiunParams();" );
		$haveFiles = false;
		foreach ( $paramNodes as $paramNode )
		{
			$paramType = $paramNode->getAttribute ( "type" );
			$paramName = $paramNode->getAttribute ( "name" );
			$isEnum = $paramNode->hasAttribute ( "enumType" );
				
			if ($haveFiles === false && $paramType === "file")
			{
				$serviceImports[] = "com.vidiun.client.VidiunFiles";
				$serviceImports[] = "com.vidiun.client.VidiunFile";
				$haveFiles = true;
				$this->appendLine ( "        VidiunFiles vfiles = new VidiunFiles();" );
			}
			
			if($paramType == "file")
			{
				$this->appendLine ( "        vfiles.add(\"$paramName\", $paramName);" );
			}
			else 
				$this->appendLine ( "        vparams.add(\"$paramName\", $paramName);" );
		}
		
		// Add files to call
		if ($haveFiles)
			if(is_null($fallbackClass))
				$this->appendLine ( "        this.vidiunClient.queueServiceCall(\"$serviceId\", \"$action\", vparams, vfiles);" );
			else
				$this->appendLine ( "        this.vidiunClient.queueServiceCall(\"$serviceId\", \"$action\", vparams, vfiles, $fallbackClass.class);" );
		else
			if(is_null($fallbackClass))
				$this->appendLine ( "        this.vidiunClient.queueServiceCall(\"$serviceId\", \"$action\", vparams);" );
			else
				$this->appendLine ( "        this.vidiunClient.queueServiceCall(\"$serviceId\", \"$action\", vparams, $fallbackClass.class);" );
	}
	
	public function handleResultType($resultType, $arrayType, &$serviceImports) 
	{
		$serviceImports[] = "com.vidiun.client.utils.ParseUtils";
		$returnCall = "        ";
		switch ($resultType)
		{
			case "array" :
				$returnCall .= "return ParseUtils.parseArray($arrayType.class, resultXmlElement);";
				break;
			case "map" :
				$returnCall .= "return ParseUtils.parseMap($arrayType.class, resultXmlElement);";
				break;
			case "bigint":
			case "time":
			case "int" :
			case "float" :
			case "bool" :
			case "string" :
				if ( $resultType == "float" )
				{
					$resultType = "double";
				}

				$this->appendLine ( "        String resultText = resultXmlElement.getTextContent();" );
				$returnCall .= "return ParseUtils.parse" . ucwords($resultType) . "(resultText);";
				break;
			default :
				$returnCall .= "return ParseUtils.parseObject($resultType.class, resultXmlElement);";
				break;
		}		
		$this->appendLine($returnCall);
	}
	
	function writeMainClient(DOMNodeList $serviceNodes, DOMNodeList $configurationNodes) 
	{
		$apiVersion = $this->_doc->documentElement->getAttribute('apiVersion');
		$date = date('y-m-d');
		
		$imports = "";
		$imports .= "package com.vidiun.client;\n";
		
		$this->startNewTextBlock ();
		$this->appendLine ( $this->getBanner () );
		$this->appendLine ( '@SuppressWarnings("serial")' );
		$this->appendLine ( "public class VidiunClient extends VidiunClientBase {" );
		$this->appendLine ( "	" );
		$this->appendLine ( "	public VidiunClient(VidiunConfiguration config) {" );
		$this->appendLine ( "		super(config);" );
		$this->appendLine ( "		");
		$this->appendLine ( "		this.setClientTag(\"java:$date\");");
		$this->appendLine ( "		this.setApiVersion(\"$apiVersion\");");
		$this->appendLine ( "	}" );
		$this->appendLine ( "	" );
		
		foreach ( $serviceNodes as $serviceNode ) 
		{
			$serviceId = $serviceNode->getAttribute ( "id" );
			if(!$this->shouldIncludeService($serviceId))
				continue;
	
			$serviceName = $serviceNode->getAttribute ( "name" );
			$javaServiceName = $serviceName . "Service";
			$javaServiceType = "Vidiun" . $this->upperCaseFirstLetter ( $javaServiceName );
			$imports .= "import com.vidiun.client.services.$javaServiceType;\n";
			
			$this->appendLine ( "	protected $javaServiceType $javaServiceName;" );
			$this->appendLine ( "	public $javaServiceType get" . $this->upperCaseFirstLetter ( $javaServiceName ) . "() {" );
			$this->appendLine ( "		if(this.$javaServiceName == null)" );
			$this->appendLine ( "			this.$javaServiceName = new $javaServiceType(this);" );
			$this->appendLine ( "	" );
			$this->appendLine ( "		return this.$javaServiceName;" );
			$this->appendLine ( "	}" );
			$this->appendLine ( "	" );
		}
	
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
				
				$type = $configurationPropertyNode->getAttribute("type");
				if(!$this->isSimpleType($type) && !$this->isArrayType($type))
				{
					$imports .= "import com.vidiun.client.types.$type;\n";
				}
				
				$type = $this->getJavaType($configurationPropertyNode, true);
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
		$this->appendLine ( "	protected void resetRequest(){");
		foreach($volatileProperties as $attributeName => $properties)
		{
			foreach($properties as $propertyName)
			{
				$this->appendLine("		this.{$attributeName}.remove(\"$propertyName\");");
			}
		}
		$this->appendLine ( "	}");
	
		
		$this->appendLine ( "}" );
		
		$imports .= "\n";
		
		$this->addFile ( $this->_baseClientPath . "/VidiunClient.java", $imports . $this->getTextBlock () );
	}
	
	protected function writeConfigurationProperty($configurationName, $name, $paramName, $type, $description)
	{
		$methodsName = ucfirst($name);
		
		$this->appendLine("	/**");
		if($description)
		{
			$this->appendLine("	 * $description");
			$this->appendLine("	 * ");
		}
		$this->appendLine("	 * @param $type \${$name}");
		$this->appendLine("	 */");
		$this->appendLine("	public void set{$methodsName}($type $name){");
		$this->appendLine("		this.{$configurationName}Configuration.put(\"$paramName\", $name);");
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
		$this->appendLine("	public $type get{$methodsName}(){");
		$this->appendLine("		if(this.{$configurationName}Configuration.containsKey(\"{$paramName}\")){");
		$this->appendLine("			return ($type) this.{$configurationName}Configuration.get(\"{$paramName}\");");
		$this->appendLine("		}");
		$this->appendLine("		");
		$this->appendLine("		return null;");
		$this->appendLine("	}");
		$this->appendLine("	");
	}
	
	function getSignature($paramNodes, $fileOverload, &$serviceImports) 
	{
		$signature = array();
		foreach ( $paramNodes as $paramNode ) 
		{
			$paramType = $paramNode->getAttribute ( "type" );
			$paramName = $paramNode->getAttribute ( "name" );
			$isEnum = $paramNode->hasAttribute ( "enumType" );

			if ($paramType == "array")
			{
				$serviceImports[] = "java.util.ArrayList";
				$serviceImports[] = "com.vidiun.client.types.*";
			}	
			elseif ($paramType == "map")
			{
				$serviceImports[] = "java.util.HashMap";
				$serviceImports[] = "com.vidiun.client.types.*";
			}	
			elseif ($isEnum)
				$serviceImports[] = "com.vidiun.client.enums.*";
			
			if ($paramType == "file")
			{
				$serviceImports = array_merge(
					$serviceImports, 
					array("java.io.File", "java.io.FileInputStream", "java.io.InputStream"));
 
				foreach ($fileOverload as $namePostfix => $paramType)
				{
					$signature[] = "{$paramType} {$paramName}{$namePostfix}";
				}
				continue;
			}
			
			if (strpos($paramType, 'Vidiun') === 0 && !$isEnum)
				$serviceImports[] = "com.vidiun.client.types.*";
			
			$javaType = $this->getJavaType($paramNode);
			
			$signature[] = "$javaType $paramName";
		}
		return implode(', ', $signature) . ")";
	}
	
	private function getBanner() 
	{
		$currentFile = $_SERVER ["SCRIPT_NAME"];
		$parts = Explode ( '/', $currentFile );
		$currentFile = $parts [count ( $parts ) - 1];
		
		$banner = "";
		$banner .= "/**\n";
		$banner .= " * This class was generated using $currentFile\n";
		$banner .= " * against an XML schema provided by Vidiun.\n";
		$banner .= " * \n";
		$banner .= " * MANUAL CHANGES TO THIS CLASS WILL BE OVERWRITTEN.\n";
		$banner .= " */\n";
		
		return $banner;
	}

	protected function replaceReservedWords($name)
	{
		switch ($name)
		{
		case "goto":
			return "{$name}_";
		default:
			return $name;
		}
	}

	public function getInitialPropertyValue($propertyNode)
	{
		$propType = $propertyNode->getAttribute ( "type" );
		switch ($propType) 
		{
		case "float" :
			return "Double.MIN_VALUE";
			
		case "bigint" :
		case "time" :
			return "Long.MIN_VALUE";
		case "int" :
			if ($propertyNode->hasAttribute ("enumType")) 
				return ""; // we do not want to initialize enums
			else 
				return "Integer.MIN_VALUE";
					
		default :
			return "";
		}
	}

	public function getDefaultValue($resultType) 
	{
		switch ($resultType)
		{
		case "":
			return '';
		
		case "int":
		case "float":
		case "bigint":
		case "time":
			return '0';
			
		case "bool":
			return 'false';
			
		default:
			return 'null';				
		}
	}
	
	public function getDefaultParamValue($paramNode)
	{
		$type = $paramNode->getAttribute ( "type" );
		$defaultValue = $paramNode->getAttribute ( "default" );
		
		switch ($type)
		{
		case "string": 
			if ($defaultValue == 'null')
				return 'null';
			else
				return "\"" . $defaultValue . "\"";
		case "bigint":
		case "time":
			$value = trim ( $defaultValue );
			if ($value == 'null')
				$value = "Long.MIN_VALUE";
			return $value;
		case "int": 
			$value = trim ( $defaultValue );
			if ($value == 'null')
				$value = "Integer.MIN_VALUE";
			
			if ($paramNode->hasAttribute ( "enumType" )) 
				return $paramNode->getAttribute ( "enumType" ) . ".get(" . $value . ")";
			else 
				return $value;
				
		case "file":
			return '(VidiunFile)null';
		
		default:
			return $defaultValue;
		}
	}
	
	public function getResultType($resultType, $arrayType, &$serviceImports) 
	{
		switch ($resultType)
		{
		case null :
			return "void";
			
		case "array" :
			$serviceImports[] = "java.util.List";
			$serviceImports[] = "com.vidiun.client.types.*";
				
			return ("List<" . $arrayType . ">");
			
		case "map" :
			$serviceImports[] = "java.util.Map";
			$serviceImports[] = "com.vidiun.client.types.*";
				
			return ("Map<String, " . $arrayType . ">");

		case "bigint" :
		case "time" :
			return "long";

		case "bool" :
			return "boolean";
			
		case "file":
		case "string" :
			return "String";
			
		default :
			$serviceImports[] = "com.vidiun.client.types.*";
			return $resultType;
		}
	}
	
	public function getJavaType($propertyNode, $enforceObject = false)
	{
		$propType = $propertyNode->getAttribute ( "type" );
		$isEnum = $propertyNode->hasAttribute ( "enumType" );
		
		switch ($propType) 
		{
		case "bool" :
			return $enforceObject ? "Boolean" : "boolean";

		case "float" :
			return $enforceObject ? "Double" : "double";

		case "bigint" :
		case "time" :
			return $enforceObject ? "Long" : "long";
			
		case "int" :
			if ($isEnum) 
				return $propertyNode->getAttribute ( "enumType" );
			else 
				return $enforceObject ? "Integer" : "int";

		case "string" :
			if ($isEnum) 
				return $propertyNode->getAttribute ( "enumType" );
			else 
				return "String";

		case "array" :
			$arrayType = $propertyNode->getAttribute ( "arrayType" );
			return "ArrayList<$arrayType>";

		case "map" :
			$arrayType = $propertyNode->getAttribute ( "arrayType" );
			return "HashMap<String, $arrayType>";

		case "file" :
			$javaType = "File";
			break;
			
		default :
			return $propType;
		}
	}
}