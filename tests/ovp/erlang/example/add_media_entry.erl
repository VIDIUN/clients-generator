#!/usr/bin/env escript
%% -*- erlang -*-
%%! -pa ./ebin -pa ./deps/jsx/ebin -pa ./deps/erlsom/ebin

-module(test1).
-import(io, [format/2]).

-include_lib("../src/vidiun_client.hrl").

main(_) ->
    application:start(inets),
    
    ClientConfiguration = #vidiun_configuration{
    	client_options = [{verbose, debug}]
    }, 
    ClientRequest = #vidiun_request{
    	vs = <<"VS Place Holder">>
    },
    Entry = #vidiun_media_entry{name = <<"test entry">>, mediaType = 2},
    Results = vidiun_media_service:add(ClientConfiguration, ClientRequest, Entry),

	io:format("Created entry: ~p~n", [Results]).
	