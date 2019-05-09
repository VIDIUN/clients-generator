## Vidiun node.js API Client Library.
Compatible with Vidiun server version @VERSION@ and above.
This client library replaces the older architecture that presented in previous node.js client library.

[![NPM](https://nodei.co/npm/vidiun-client.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/vidiun-client/)


You can install this client library using npm with:
```
npm install vidiun-client 
```

## Sanity Check
- Copy config.template.json to config.json  and set partnerId, secret and serviceUrl
- Run npm test

## Code contributions

We are happy to accept pull requests, please see [contribution guidelines](https://github.com/vidiun/platform-install-packages/blob/master/doc/Contributing-to-the-Vidiun-Platform.md)

The contents of this client are auto generated from https://github.com/vidiun/clients-generator and pull requests should be made there, rather than to the https://github.com/vidiun/VidiunGeneratedAPIClientsNodeJS repo.

Relevant files are:
- sources/node2
- tests/ovp/node2
- lib/Node2ClientGenerator.php

[![Build Status](https://travis-ci.org/vidiun/VidiunGeneratedAPIClientsNodeJS.svg?branch=master)](https://travis-ci.org/vidiun/VidiunGeneratedAPIClientsNodeJS)
