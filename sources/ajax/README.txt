Vidiun JavaScript API Client Library.

The library contain the following files:
 - example.html
 - jquery-3.1.0.min.js
 - VidiunClient.js - all client functionality without the services.
 - VidiunClient.min.js - VidiunClient.js minified.
 - VidiunFullClient.js - all client functionality including all services.
 - VidiunFullClient.min.js - VidiunFullClient.js minified.
 - Services files, e.g. VidiunAccessControlProfileService.js.
 - Minified services files, e.g. VidiunAccessControlProfileService.min.js.

If you're lazy developer and don't want to include each used service separately, 
or if you find yourself including many services as run time,
you might want to use the single VidiunFullClient.min.js that already contains all services.

If your application is using merely few services, it would be more efficient to include only VidiunClient.min.js
and the minified services files that you need.

