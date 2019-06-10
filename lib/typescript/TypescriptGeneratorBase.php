<?php

require_once (__DIR__. '/Utils.php');


class TypescriptGeneratorBase
{
    protected $serverMetadata;
    protected $utils;

    function __construct($serverMetadata)
    {
        $this->utils = new Utils();
        $this->serverMetadata = $serverMetadata;
    }

    function toNG2DefaultByType($type, $typeClassName, $defaultValue)
    {
        $result = null;

        if ($defaultValue === "null")
        {
            // null values are treated as properties to be deleted. cannot be used as default value
            $defaultValue = "";
        }

            switch ($type) {
                case VidiunServerTypes::Simple:
                    if ($typeClassName == "string") {
                        $result = $defaultValue ? "\"{$defaultValue}\"" : "";
                    } else if ($defaultValue) {
                        $result = $defaultValue;
                    } else {
                        // TODO workaround, handling scenarios like param of type int without default value
                        $result = "";
                    }
                    break;
                case VidiunServerTypes::ArrayOfObjects:
                    $result = "[]";
                    break;
                case VidiunServerTypes::ArrayOfObjects:
                    $result = "{}";
                    break;
                default:
                    $result = $defaultValue ? $defaultValue : "";
                    break;
            }

        return $result;
    }


    protected function toNG2TypeExp($type, $typeClassName, $resultCreatedCallback)
    {
        $result = null;
        switch ($type) {
            case VidiunServerTypes::File:
                trigger_error('Vidiun server type "File" must be handled manually');
                break;
            case VidiunServerTypes::Simple:
                switch ($typeClassName) {
                    case "bool":
                        $result = "boolean";
                        break;
                    case "bigint":
                    case "float":
                    case "int":
                        $result = 'number';
                        break;
                    case "string":
                        $result = 'string';
                        break;
                    default:
                        throw new Exception("Unknown simple type {$typeClassName}");
                }
                break;
            case VidiunServerTypes::ArrayOfObjects:
                $result = "{$typeClassName}[]";
                break;
            case VidiunServerTypes::MapOfObjects:
                $result = "{ [key : string] : $typeClassName}";
                break;
            case VidiunServerTypes::EnumOfInt:
            case VidiunServerTypes::EnumOfString:
            case VidiunServerTypes::Object:
                $result = $typeClassName;
                break;
            case VidiunServerTypes::Date:
                $result = "Date";
                break;
            case VidiunServerTypes::Void:
                $result = "void";
                break;
            default:
                throw new Exception("toNG2TypeExp: Unknown type requested {$type}");
        }

        if (isset($resultCreatedCallback)) {
            $result = $resultCreatedCallback($type, $typeClassName, $result);
        }
        return $result;
    }
    protected function getBanner()
    {
        $banner = "";
        return $banner;
    }

}