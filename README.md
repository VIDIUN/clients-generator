# Vidiun Client Generator
The code in this repo is used to auto generate the Vidiun client libraries for each supported language.

[![License](https://img.shields.io/badge/license-AGPLv3-blue.svg)](http://www.gnu.org/licenses/agpl-3.0.html)

## Deployment Instructions
The list of supported clients is [here](config/generator.all.ini)

Download the API scheme XML from http://www.vidiun.com/api_v3/api_schema.php.

To generate one client run:
```
$ php /opt/vidiun/clients-generator/exec.php -x/path-to-xml/VidiunClient.xml $CLIENT_NAME
```

For example, to generate php53 run:
```
php /opt/vidiun/clients-generator/exec.php -x/path-to-xml/VidiunClient.xml php53
```

To generate all available clients, run:
```
while read CLIENT;do php /opt/vidiun/clients-generator/exec.php -x/path-to-xml/VidiunClient.xml $CLIENT;done < /opt/vidiun/clients-generator/config/generator.all.ini
```

## Getting started with the API
To learn how to use the Vidiun API, go to [developer.vidiun.com](https://developer.vidiun.com/)

## How you can help (guidelines for contributors) 
Thank you for helping Vidiun grow! If you'd like to contribute please follow these steps:
* Use the repository issues tracker to report bugs or feature requests
* Read [Contributing Code to the Vidiun Platform](https://github.com/vidiun/platform-install-packages/blob/master/doc/Contributing-to-the-Vidiun-Platform.md)
* Sign the [Vidiun Contributor License Agreement](https://agentcontribs.vidiun.org/)

## Where to get help
* Join the [Vidiun Community Forums](https://forum.vidiun.org/) to ask questions or start discussions
* Read the [Code of conduct](https://forum.vidiun.org/faq) and be patient and respectful

## Get in touch
You can learn more about Vidiun and start a free trial at: http://corp.vidiun.com    
Contact us via Twitter [@Vidiun](https://twitter.com/Vidiun) or email: community@vidiun.com  
We'd love to hear from you!

## License and Copyright Information
All code in this project is released under the [AGPLv3 license](http://www.gnu.org/licenses/agpl-3.0.html) unless a different license for a particular library is specified in the applicable library path.   

Copyright © Vidiun Inc. All rights reserved.   
Authors and contributors: See [GitHub contributors list](https://github.com/vidiun/clients-generator/graphs/contributors).  
