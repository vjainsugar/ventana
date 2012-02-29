describe('SugarCRM Javascript API', function () {

    beforeEach(function () {
        this.validUsername = "admin";
        this.validPassword = "asdf";
        this.invalidUserName = "invalid";
        this.invalidPassword = "invalid";
        //instantiating API Instance
        this.api = SUGAR.Api.getInstance();
        //get fresh fixtures
        this.fixtures = fixtures.api;
        this.fixtures.sugarFields = sugarFieldsFixtures;
        //create fakeserver to make requests
        this.server = sinon.fakeServer.create();
        this.callbacks = {
            success:function (data) {
                //console.log("sucess callback");
                //console.log("data");
                //console.log(data);
            },
            error:function (data) {
                //console.log("error callback");
            }
        };
    });

    afterEach(function () {
        this.server.restore();
    });

    it('should return an api instance', function () {
        expect(typeof(this.api)).toBe('object');
        expect(this.api.baseUrl).toEqual('/rest/v10');
    });

    describe('requestHandler', function () {
        it('should make a request with the correct request url', function () {
            // Spy on jQuery's ajax method
            var spy = sinon.spy(jQuery, 'ajax');

            //@arguments: method, URL, options
            this.api.call('get', '/rest/v10/contact');

            // Spy was called
            expect(spy).toHaveBeenCalled();

            // Check url property of first argument
            expect(spy.getCall(0).args[0].url)
                .toEqual("/rest/v10/contact");
            // Restore jQuery.ajax to normal
            jQuery.ajax.restore();
        });

        it('should set the right method on request', function () {
            // Spy on jQuery's ajax method
            var spy = sinon.spy(jQuery, 'ajax');

            //@arguments: method, URL, options
            this.api.call('update', '/rest/v10/contacts');

            // Spy was called
            expect(spy).toHaveBeenCalled();

            // Check url property of first argument
            expect(spy.getCall(0).args[0].type)
                .toEqual("PUT");

            // Restore jQuery.ajax to normal
            jQuery.ajax.restore();
        });

        it('should set the right options on request', function () {
            // Spy on jQuery's ajax method
            var spy = sinon.spy(jQuery, 'ajax');

            //@arguments: method, URL, options
            this.api.call('get', '/rest/v10/contacts', {}, {async:true});

            // Spy was called
            expect(spy).toHaveBeenCalled();

            // Check url property of first argument
            expect(spy.getCall(0).args[0].async).toBeTruthy();

            // Restore jQuery.ajax to normal
            jQuery.ajax.restore();
        });

        it('should handle successful responses', function () {

            this.server.respondWith("GET", "/rest/v10/contacts/1234",
                [200, {  "Content-Type":"application/json"},
                    JSON.stringify(this.fixtures["rest/v10/contact"].GET.response[1])]);

            var result = this.api.call('get', '/rest/v10/contacts/1234', {}, {}, this.callbacks);
            this.server.respond(); //tell server to respond to pending async call

            expect(result.responseText).toEqual(JSON.stringify(this.fixtures["rest/v10/contact"].GET.response[1]));
        });

        it('should fire error callbacks and return requests objects on error', function () {

            this.server.respondWith("GET", "rest/v10/contacts/123",
                [fixtures.api.responseErrors.fourhundred.code, { "Content-Type":"application/json" },
                    this.fixtures.responseErrors.fourhundred.body]);
            var result = this.api.call('get', 'rest/v10/contacts/123', {}, {}, this.callbacks);

            this.server.respond(); //tell server to respond to pending async call

            expect(result.responseText).toEqual(this.fixtures.responseErrors.fourhundred.body);
        });
    });


    describe('urlBuilder', function () {
        it('should build resource URLs for resources without ids', function () {
            var attributes = {};
            var module = "Contacts";
            var action = "create";
            var params = [];
            var url = this.api.buildURL(module, action, attributes, params);

            expect(url).toEqual('/rest/v10/Contacts');
        });

        it('should build resource URLs for resources with ids', function () {
            var module = "Contacts";
            var action = "update";
            var params = [];
            var attributes = {module:'contacts', id:'1234'}
            var url = this.api.buildURL(module, action, attributes, params);

            expect(url).toEqual('/rest/v10/Contacts/1234');
        });

        it('should build resource URLs for resources with standard actions', function () {
            var module = "Contacts";
            var action = "update";
            var params = [];
            var attributes = {module:'contacts', id:'1234', action:'Update'}
            var url = this.api.buildURL(module, action, attributes, params);

            expect(url).toEqual('/rest/v10/Contacts/1234');
        });

        it('should build resource URLs for resources with custom actions', function () {
            var module = "Contacts";
            var action = "customAction";
            var params = [];
            var attributes = {module:'contacts', id:'1234'}
            var url = this.api.buildURL(module, action, attributes, params);

            expect(url).toEqual('/rest/v10/Contacts/1234/customAction');
        });


        it('should build resource URLs for resources with custom params', function () {
            var module = "Contacts";
            var action = "update";
            var params = [
                {key:"fields", value:"first_name,last_name"},
                {key:"timestamp", value:"NOW"}
            ];
            var attributes = { id:'1234'}
            var url = this.api.buildURL(module, action, attributes, params);
            expect(url).toEqual('/rest/v10/Contacts/1234?fields=first_name,last_name&timestamp=NOW');
        });
    });

    describe('CRUD actions', function () {
        it('should get a bean', function () {
            var spy = sinon.spy(this.callbacks, 'success');
            var module = "Contacts";
            var params = "";
            var attributes = {id:"1234"};

            this.server.respondWith("GET", "/rest/v10/Contacts/1234",
                [200, {  "Content-Type":"application/json"},
                    JSON.stringify(this.fixtures["rest/v10/contact"].GET.response[1])]);

            var bean = this.api.get(module, attributes, params, this.callbacks);

            this.server.respond(); //tell server to respond to pending async call
            expect(spy.getCall(0).args[0]).toEqual(this.fixtures["rest/v10/contact"].GET.response[1]);

            //restore spies
            this.callbacks.success.restore();
        });

        it('should create bean', function () {
            var spy = sinon.spy(this.callbacks, 'success');
            var module = "Contacts";
            var params = "";
            var attributes = {first_name:"Ronald", last_name:"McDonald", phone_work:"0980987", description:"This dude is cool."};

            this.server.respondWith("POST", "/rest/v10/Contacts",
                [200, {  "Content-Type":"application/json"},
                    JSON.stringify(this.fixtures["rest/v10/contact"].POST.response)]);

            this.api.create(module, attributes, params, this.callbacks);

            this.server.respond(); //tell server to respond to pending async call
            expect(spy.getCall(0).args[0]).toEqual(this.fixtures["rest/v10/contact"].POST.response);

            //restore spies
            this.callbacks.success.restore();
        });


        it('should get beans', function () {
            var spy = sinon.spy(this.callbacks, 'success');
            var module = "Contacts";
            var params = "";
            var attributes = {};

            this.server.respondWith("GET", "/rest/v10/Contacts",
                [200, {  "Content-Type":"application/json"},
                    JSON.stringify(this.fixtures["rest/v10/contact"].GET.response)]);

            var bean = this.api.get(module, attributes, params, this.callbacks);

            this.server.respond(); //tell server to respond to pending async call
            expect(spy.getCall(0).args[0]).toEqual(this.fixtures["rest/v10/contact"].GET.response);

            //restore spies
            this.callbacks.success.restore();
        });

        it('should update bean', function () {
            var module = "Contacts";
            var params = "";
            var attributes = {first_name:"Ronald", last_name:"McDonald", phone_work:"1234123", description:"This dude is cool."};
            var spy = sinon.spy(this.callbacks, 'success');

            this.server.respondWith("PUT", "/rest/v10/Contacts",
                [200, {  "Content-Type":"application/json"},
                    ""]);

            this.api.update(module, attributes, params, this.callbacks);

            this.server.respond(); //tell server to respond to pending async call
            expect(spy.getCall(0).args[0]).toEqual(null);
            expect(spy.getCall(0).args[2].status).toEqual(200);
            expect(spy.getCall(0).args[2].responseText).toEqual("");

            //restore spies
            this.callbacks.success.restore();
        });

        it('should delete bean', function () {
            var spy1 = sinon.spy(this.callbacks, 'error');
            var spy = sinon.spy(this.callbacks, 'success');
            var module = "Contacts";
            var params = "";
            var attributes = {id:"1234"};

            this.server.respondWith("DELETE", "/rest/v10/Contacts/1234",
                [200, {  "Content-Type":"application/json"}, ""]);

            this.api.delete(module, attributes, params, this.callbacks);

            this.server.respond(); //tell server to respond to pending async call
            expect(spy.getCall(0).args[0]).toEqual(null);
            expect(spy.getCall(0).args[2].status).toEqual(200);
            expect(spy.getCall(0).args[2].responseText).toEqual("");

            //restore spies
            this.callbacks.success.restore();
        });

    });

    describe('sugar actions', function () {
        it('should retrieve metadata', function () {
            var types = [];
            var modules = ["Contacts"];
            var callspy = sinon.spy(this.api, 'call');
            var ajaxspy = sinon.spy($, 'ajax');
            var spy = sinon.spy(this.callbacks, 'success');
            //this.api.debug=true;
            this.server.respondWith("GET", "/rest/v10/metadata?type=&filter=Contacts",
                [200, {  "Content-Type":"application/json"},
                    JSON.stringify(fixtures.metadata.Contacts)]);

            var metadata = this.api.getMetadata(types, modules, this.callbacks);

            this.server.respond(); //tell server to respond to pending async call
            expect(spy.getCall(0).args[0]).toEqual(fixtures.metadata.Contacts);
            expect(callspy.getCall(0).args[1]).toEqual("/rest/v10/metadata?type=&filter=Contacts");
            expect(ajaxspy).toHaveBeenCalledOnce();

            //restore spies
            this.api.call.restore();
            $.ajax.restore();
            this.callbacks.success.restore();
        });

        it('should retrieve sugarFields', function () {
            var callspy = sinon.spy(this.api, 'call');
            var ajaxspy = sinon.spy($, 'ajax');
            var spy = sinon.spy(this.callbacks, 'success');
            var hash = "asdf";

            this.server.respondWith("GET", "/rest/v10/sugarFields?md5=asdf",
                [200, {  "Content-Type":"application/json"},
                    JSON.stringify(this.fixtures.sugarFields)]);

            var sugarFieldData = this.api.getSugarFields(hash, this.callbacks);

            this.server.respond(); //tell server to respond to pending async call
            expect(spy.getCall(0).args[0]).toEqual(this.fixtures.sugarFields);
            expect(callspy.getCall(0).args[1]).toEqual("/rest/v10/sugarFields?md5=asdf");
            expect(ajaxspy).toHaveBeenCalledOnce();

            //restore spies
            this.api.call.restore();
            $.ajax.restore();
            this.callbacks.success.restore();
        });

        it('should login users with correct credentials', function () {
            var callspy = sinon.spy(this.api, 'call');
            var ajaxspy = sinon.spy($, 'ajax');
            var spy = sinon.spy(this.callbacks, 'success');
            var extraInfo = {
                "type":"text",
                "client-info":{
                    "uuid":"xyz",
                    "model":"iPhone3,1",
                    "osVersion":"5.0.1",
                    "carrier":"att",
                    "appVersion":"SugarMobile 1.0",
                    "ismobile":true
                }
            };

            this.server.respondWith("POST", "/rest/v10/login",
                [200, {  "Content-Type":"application/json"},
                    JSON.stringify(this.fixtures["rest/v10/login"].POST.response)]);

            var loginResult = this.api.login(this.validUsername, this.validPassword, extraInfo, this.callbacks);
            this.server.respond(); //tell server to respond to pending async call

            expect(spy.getCall(0).args[0]).toEqual(this.fixtures["rest/v10/login"].POST.response);
            expect(callspy.getCall(0).args[1]).toEqual("/rest/v10/login");
            expect(ajaxspy).toHaveBeenCalledOnce();
            expect(this.api.isAuthenticated()).toBeTruthy();

            //restore spies
            this.api.call.restore();
            $.ajax.restore();
            this.callbacks.success.restore();
        });

        it('should not login users with incorrect credentials', function () {
            var callspy = sinon.spy(this.api, 'call');
            var ajaxspy = sinon.spy($, 'ajax');
            var spy = sinon.spy(this.callbacks, 'error');
            var extraInfo = {
                "type":"text",
                "client-info":{
                    "uuid":"xyz",
                    "model":"iPhone3,1",
                    "osVersion":"5.0.1",
                    "carrier":"att",
                    "appVersion":"SugarMobile 1.0",
                    "ismobile":true
                }
            };

            this.server.respondWith("POST", "/rest/v10/login",
                [500, {  "Content-Type":"application/json"},
                    ""]);

            var loginResult = this.api.login(this.invalidUsername, this.invalidPassword, extraInfo, this.callbacks);

            this.server.respond(); //tell server to respond to pending async call

            expect(spy.getCall(0).args[0].status).toEqual(500);
            expect(spy.getCall(0).args[0].responseText).toEqual("");
            expect(callspy.getCall(0).args[1]).toEqual("/rest/v10/login");
            expect(ajaxspy).toHaveBeenCalledOnce();

            //restore spies
            this.api.call.restore();
            $.ajax.restore();
        });

        it('should check if user is authenticated', function () {
            var spy = sinon.spy(this.callbacks, 'success');
            var extraInfo = {
                "type":"text",
                "client-info":{
                    "uuid":"xyz",
                    "model":"iPhone3,1",
                    "osVersion":"5.0.1",
                    "carrier":"att",
                    "appVersion":"SugarMobile 1.0",
                    "ismobile":true
                }
            };

            this.server.respondWith("POST", "/rest/v10/login",
                [200, {  "Content-Type":"application/json"},
                    JSON.stringify(this.fixtures["rest/v10/login"].POST.response)]);

            var loginResult = this.api.login(this.validUsername, this.validPassword, extraInfo, this.callbacks);
            this.server.respond(); //tell server to respond to pending async call

            var loginState = this.api.isAuthenticated();

            expect(loginState).toBeTruthy();
        });

        it('should logout user', function () {
            var callspy = sinon.spy(this.api, 'call');
            var ajaxspy = sinon.spy($, 'ajax');
            var spy = sinon.spy(this.callbacks, 'success');

            var extraInfo = {
                "type":"text"
            };

            // login
            this.server.respondWith("POST", "/rest/v10/login",
                [200, {"Content-Type":"application/json"},
                    JSON.stringify(this.fixtures["rest/v10/login"].POST.response)]);

            var loginResult = this.api.login(this.validUsername, this.validPassword, extraInfo, this.callbacks);
            this.server.respond(); //tell server to respond to pending async call

            expect(spy.getCall(0).args[0]).toEqual(this.fixtures["rest/v10/login"].POST.response);
            expect(this.api.isAuthenticated()).toBeTruthy();
            // now check logout
            this.server.respondWith("POST", "/rest/v10/logout", [200, {"Content-Type":"application/json"}, ""]);

            var result = this.api.logout(this.callbacks);

            this.server.respond(); //tell server to respond to pending async call

            expect(callspy.getCall(1).args[1]).toEqual("/rest/v10/logout");
            expect(ajaxspy).toHaveBeenCalledTwice();
            expect(result.status).toEqual(200);
            expect(result.responseText).toEqual("");
            expect(this.api.isAuthenticated()).toBeFalsy();

            //restore spies
            this.callbacks.success.restore();
            this.api.call.restore();
            $.ajax.restore();
        });
    });

});

