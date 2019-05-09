# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 11.3.0 (2019-04-11)

### Features

* Send vidiun request with a specific format (i.e json, xml, excel)

### Fix

* Pass serialized parameters to ott server as part of upload request

## 11.2.0 (2019-01-29)

### Features

* For ott clients the client tag now is added to the request body.

### Fix

* For ott clients requesting a url type request now generates the url with format value 20
* For ott clients upload requests now sends all parameters as part of the request body

## 11.1.1 (2018-11-24)

### Fix

* re-enable library unit-tests

## 11.1.0 (2018-11-18)

### Features

* update minimal custom chunk size to 100Kb

### Fix

* use user custom chunk size if provided  

## 11.0.0 (2018-05-09)

### BREAKING CHANGES

upgrade Angular stack from v5 to v6 which affected library public API

* module imports change

before - nested imports were supported
```
import { VidiunUser } from 'vidiun-ngx-client/api/types/VidiunUser';
import { CategoryUpdateAction } from "vidiun-ngx-client/api/types/CategoryUpdateAction";
```

after - all imports should be done against the library entry point
```
 import { VidiunUser, CategoryUpdateAction } from 'vidiun-ngx-client';
```

* rename `VidiunTypesFactory` to `VidiunObjectBaseFactory` 
before
```
import { VidiunTypesFactory } from 'vidiun-ngx-client';

const clonedEntry = Object.assign(VidiunTypesFactory.createObject(entry), entry);
```

after
```
import { VidiunObjectBaseFactory } from 'vidiun-ngx-client';

const clonedEntry = Object.assign(VidiunObjectBaseFactory.createObject(entry), entry);
```
  

## 10.3.1 (2018-05-09)

### Fix

* build upload url correctly to prevent failured during upload 


## 10.3.0 (2018-05-08)

### Features

* provide api to allow sending empty arrays to the server

To allow sending empty arrays for properties, use `allowEmptyArray()` method:
```
yourObjectInstance.allowEmptyArray('theRelevantArrayPropertyName')
``` 
this will instruct the vidiun client to send empty arrays if assigned for `restrictions` property.

## 10.2.0 (2018-05-03)

### Features

* parse relatedObjects in responses from the server

## 10.1.1 (2018-04-08)

### Fix

* provide the api version as part of the multi-request payload instead of sending it as part of each inner requests payload 


## 10.1.0 (2018-03-25)

### Fix

* expose args value on VidiunAPIException if provided by the server

### Features

* update services/actions according with schema from 24/03/18 20:17:56

## 10.0.0 (2018-03-12)

### Fix

* upload file abort and network connectivity behavior
* unhandled error when overriding
* in vidiun client rename `overrideOptions` to `appendOptions`
* in vidiun client rename `resetOptions` to `setdOptions`
* in vidiun client rename `overrideDefaultRequestOptions` to `appendDefaultRequestOptions`
* in vidiun client rename `resetDefaultRequestOptions` to `setDefaultRequestOptions`

## 9.1.0 (2018-03-11)

### Features

* tag network request by adding postfix to the client tag



## 9.0.0 (2018-03-10)

### Fix

* parse server response according to server type (OTT, OVP)
* allow having a property of the request with the same name of a property defined as a shared request property. solves an issue introduced by the OTT server

### Features

* allow adding options property to requests with general information such as vs, partnerId, response profile.
* allow adding options property to client service.
* allow adding default options property to be used with all requests.
* add `getFirstError()` method to vidiun multi response object which simplify extracting the error of the first request that failed.

### BREAKING CHANGES


* `VidiunClientConfiguration` was replaced with `VidiunClientOptions`. Declaring client options now uses injection token as shown below:

Before (in `app.module.ts`):
```
export function clientConfigurationFactory() {
    const result = new VidiunClientConfiguration();
    result.endpointUrl = getVidiunServerUri();
    result.clientTag = 'VMCng';
    return result;
}

providers: [
    ...
    VidiunClient,
    {
      provide: VidiunClientConfiguration,
      useFactory: clientConfigurationFactory
    }
]
```

After (in `app.module.ts`):
```
import {VidiunClientModule, VidiunClientOptions} from 'vidiun-ngx-client';

export function vidiunClientOptionsFactory(): VidiunClientOptions {
    return  {
        endpointUrl: getVidiunServerUri(),
        clientTag: 'app'
    };
}

@NgModule({
imports: [
    ...
    VidiunClientModule.forRoot(vidiunClientOptionsFactory)
]
```

* `VidiunClient` exposes a method for setting default request options as fallback values

Before (in `app.module.ts`):
```
import { VidiunClient } from 'vidiun-ngx-client';

export class AppModule {
    constructor(private _vidiunClient: VidiunClient) {
    }

    private onUserLoggedIn(vs: string, partnerId: number)
      {
          this._vidiunClient.vs = vs;
          this._vidiunClient.partnerId = partnerId;
      }
}
```

After (in `app.module.ts`):
```
import { VidiunClient } from 'vidiun-ngx-client';

export class AppModule {
    constructor(private _vidiunClient: VidiunClient) {
    }

    private onUserLoggedIn(vs: string, partnerId: number)
      {
          this._vidiunClient.setDefaultRequestOptions({
              vs,
              partnerId
          });
      }
}
```

* changing client options manually is done using a dedicated method

```
import { VidiunClient } from 'vidiun-ngx-client';

export class AppModule {
    constructor(private _vidiunClient: VidiunClient) {
        _vidiunClient.appendOptions({
            endpointUrl: 'new endpoint url'
        })
    }
}

```


* setting request options on any request can be done as follows:

Before
```
 return this._vidiunClient.request(new PlaylistExecuteAction({
         id: this.data.id,
         acceptedTypes: [VidiunMediaEntry],
         responseProfile: responseProfile
       }));
```


After
```
return this._vidiunClient.request(new PlaylistExecuteAction({
         id: this.data.id
       }).setRequestOptions({
            acceptedTypes: [VidiunMediaEntry],
            responseProfile: responseProfile
        })
      ));
```



## 8.0.0 (2018-03-01)

### Features

* use typescript support for enum of type string
* upgrade stack to angular 5 and add support for AOT compilation

### BREAKING CHANGES

* The client uses Typescript support for string enums (starting version 2.4.0).

Before
to compare values of two enum of type string you would do one of the following.
```
value.equals(VidiunConversionProfileType.media)
```

After
The transpiled code is using values of type string and you can use regular operators on those values.
```
value === VidiunConversionProfileType.media
```

If your IDE supports Find&Replace using regex you can use the following expression `[.]equals\((.+?)\)` and replace with ` === $1` (where $1 is a place holder for the value extract from the expression. This syntax is used in IntelliJ and WebStorm)

In addition, you no longer need to use `.toString()` to get the value represented by string. During the migration you are encourage not to try and remove the usage of `.toString()` since this function is used also with Ecma5 objects. Leaving those expression will have no effect since you essentially convert string to string.






## 7.1.1 (2017-12-07)

### Features

* non-chunked file upload progress fix


## 7.1.0 (2017-11-30)

### Features

* support requests that serve files by returning a valid download url for that files



## 7.0.2 (2017-11-28)

### Features

* update api using schema from 26/11/17 01:43:07



## 7.0.1 (2017-11-28)


### Bug Fixes

* use ngc during tranpiling to support angular-cli based applications (8076c96)




# 7.0.0 (2017-11-27)


### Features

* embed generated api into vidiun-client (0446c00)


### BREAKING CHANGES

* * you need to uninstall vidiun-typescript-client (npm uninstall vidiun-typescript-client).

* rename all imports to use the embedded api
before:
```
import { ... } from 'vidiun-typescript-client'
import { ... } from 'vidiun-typescript-client/types'
```

after:
```
import { ... } from '@vidiun-ng/vidiun-client'
import { ... } from '@vidiun-ng/vidiun-client/api/types'
```




# 6.0.0 (2017-11-26)


### Bug Fixes

* append action value to endpoint uri only if provided by request (e53a9b5)
* generate endpoint to service with '/api_v3/' as a prefix. (fdaf513)
* support empty array as a valid resopnse (6c677df)
* Fix upload file in IE11 and edge and Safari

### Features

* add unit-testing (2683820)
* update services according to new schema from 08/10/17 18:46:25 (0350d10)


### BREAKING CHANGES

* before:
The service api provided by the application included `/api_v3/` when provided
```
"https://www.vidiun.com/api_v3/"
```

after:
The service api provided by the application shouldn't include `/api_v3/` when provided
```
"https://www.vidiun.com"
```




## 5.1.2 (2017-10-29)


### Bug Fixes

* compile issue with typescript version (c3cfd95)
* use chunk upload only for services that support it (43dd5e2)




## 5.1.1 (2017-10-22)


### Bug Fixes

* upload of new files whose size is smaller then the chunk size (107635e)




# 5.1.0 (2017-10-16)


### Bug Fixes

* generated package.json private attribute is set to false to allow publish to npm (525a295)
* remove gibrish that prevented compilation (c61caac)


### Features

* add documentation to service actions (301586e)
* support chunk file upload and resume upload action (e04830a)
* syncing services with server changes on date 02/10/17 04:15:21 (de7a5a1)




# 5.0.0 (2017-08-14)


### Bug Fixes

* fix 'acceptedTypes' property compilation issue. (efe50aa)


### Features

* attach generated schema 'apiVersion' to each request (5e5e2c8)
* support vidiun object properties of type map (c866ca2)
* update services/actions (46beb73)


### BREAKING CHANGES

* changes in public api (services/actions/objects)




# 4.0.0 (2017-07-13)


### Features

* add service XInternal action XAddBulkDownload (59b0ac6)
* prevent importing the complete library implicitly, force import types explicitly (cdfa3a6)


### BREAKING CHANGES

* Any imports from types/all should be modified to explicitly import the relevant types.

Before:

import { VidiunPermissionFilter, UserLoginByLoginIdAction } from 'vidiun-typescript-client/types/all';

After:

import { VidiunPermissionFilter } from 'vidiun-typescript-client/types/VidiunPermissionFilter';
import { UserLoginByLoginIdAction } from 'vidiun-typescript-client/types/UserLoginByLoginIdAction';




# 3.0.0 (2017-07-13)


### Features

* expose global vs and partner id from the client instead of from the configuration object. (fac1eb7)


### BREAKING CHANGES

* the global vs and partner id must be assigned on the client (previously was on the configuration)




## 1.1.1 (2017-05-10)




# 2.1.0 (2017-05-22)


### Features

* separate dynamic info (vs, partnerid) from configuration info (client tag, endpointUrl) (12bf78e)




# 2.0.0 (2017-05-18)


### Features

* **vidiun-clients:** remove configuration objects, assign dynamic data directly on the clients (8a30a72)


### BREAKING CHANGES

* **vidiun-clients:** the 'VidiunClientBaseConfiguration' and 'VidiunHttpClientConfiguration' objects were removed.

Any dynamic data assigned on them should be done directly on the client instance.




## 1.1.1 (2017-05-10)




# [1.1.0](http://github.com/VidiunGeneratedAPIClientsTypescript/compare/v1.0.0...v1.1.0) (2017-05-09)


### Bug Fixes

* fix upload file process ([2db951c](http://github.com/VidiunGeneratedAPIClientsTypescript/commit/2db951c))
* prevent IDE intellisense from importing by default types from the module that bundle the complete library ([61e5c4e](http://github.com/VidiunGeneratedAPIClientsTypescript/commit/61e5c4e))
* seamlessly add enum types used by requests to the bundle ([c417868](http://github.com/VidiunGeneratedAPIClientsTypescript/commit/c417868))
* send 'partnerId' only if provided (previously was sending 'undefined' if wan't provided) ([e128dfc](http://github.com/VidiunGeneratedAPIClientsTypescript/commit/e128dfc))
* setting dependent property in multi-request now uses zero index base. ([1599905](http://github.com/VidiunGeneratedAPIClientsTypescript/commit/1599905))


### Features

* notify developer when response from server returned with vidiun object type that wasn't bundled into the application ([78a2f7c](http://github.com/VidiunGeneratedAPIClientsTypescript/commit/78a2f7c))




# 1.0.0 (2017-05-08)


### Features

* **bundling:** we now support bundling only what the app is using ([a7b8ef4](http://github.com/VidiunGeneratedAPIClientsTypescript/commit/a7b8ef4))




# 1.0.0-beta.1 (2017-05-07)

- [x] Bundle only used actions, classes and enums (a.k.a vidiun types) in your application to reduce bundle size.
- [x] Represent each vidiun types as a typed object with simple API.
- [x] Use generated action classes to easily access Vidiun services.
- [x] Invoke multi-requests against the server.
  - [x] Handle each request response separately.
  - [x] Expose interceptors to handle multi-request responses together.
  - [x] Use simple API to define dependent properties between requests using placeholders.
- [x] Support default properties value in requests.
- [x] Support the following property types:
   - [x] Dates.
   - [x] Simple types (number, string, boolean).  
   - [x] Enums (both numeric enums or string enums).
   - [x] Vidiun objects including inheritance and fallback mechanism.
- [x] Handle 'readonly' fields, guard against mutating them or sending them to the server.
- [x] Ability to upload files including abort & retry operations.
- [x] Hide complex server API syntax such as:
   - [x] Classify objects using 'objectType' property.
   - [x] Mark Field for deletion
- [x] Share properties among requests to reduce code duplication.
   - [x] Valid VS
   - [x] Partner Id
   - [x] Client Tag
