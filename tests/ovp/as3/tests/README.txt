The test API sample shows a simple client setup and session creation call.
For good practice, it is always best to keep the secret key hidden in the server and recieve the vidiun session (aka VS) via flashvars or a different external method.

To setup the sample to compile, copy the com folder to the root of the sample code, open the VidiunClientSample.fla in Flash IDE (CS4 and above) and compile.
You should see an error saying you need to define the partner id and secret api key. 
Open the VidiunClientSample.as file and edit the following lines, adding your Vidiun partner information:
		private const API_SECRET:String = "YOUR_USER_SECRET";
		private const VIDIUN_PARTNER_ID:int = 54321;
Compile again. You should get a message in the trace window indicating the session create call was successful and the actual VS returned from the Vidiun server.

If you are using a Vidiun self hosted server, open the VidiunClientSample.as file and uncomment and modify the following line (change the url to your Vidiun server domain):
//configuration.domain = "http://www.myvidiundomain.com";