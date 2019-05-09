
Package contents
=================
 - The Vidiun client library base (VidiunClientBase, VidiunObjectBase...)
 - Auto generated core APIs (VidiunClient...)
 - Required JAR files
 - Project files
 - Library test code and data files (VidiunClientTester/*)
 - Reference application (DemoApplication/*)

Running the test code
======================
1. Import the projects into Eclipse - 
	a. right click in the Package Explorer
	b. Import...
	c. Android->Existing Android Code Into Workspace
	d. Select the root dir containing all 3 android projects (VidiunClient, VidiunClientTester and DemoApplication)
	e. Make sure all 3 projects are selected, click ok
	f. Wait until the projects are automatically compiled (initially some errors will appear, 
		until the VidiunClient is compiled, they should go away automatically)
2. Edit VidiunClientTester/src/com.vidiun.client.test/VidiunTestConfig and fill out your Vidiun account information
3. Right click on VidiunClientTester/src/com.vidiun.client.test/VidiunTestSuite
4. Run As->Android JUnit Test


Running the demo application
=============================
1. Import the projects into Eclipse (see above)
2. Edit Vidiun/src/com.vidiun.activity/Settings.java
3. Search for etEmail.setText and etPassword.setText
4. Set the default user / password to the credentials of you Vidiun VMC account
5. Hit the play button
