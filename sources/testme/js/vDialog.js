
/**
 * Class that represents a single request, as stand alone or as part of multi-request
 * @class vDialog
 */
function vDialog(){
}

vDialog.prototype = {};
vDialog.prototype.className = 'vDialog';
vDialog.prototype.params = null;
vDialog.prototype.name = null;
vDialog.prototype.parent = null;
vDialog.prototype.jqElement = null;
vDialog.prototype.jqParamsContainer = null;
vDialog.prototype.level = 0;
vDialog.prototype.fields = {};
vDialog.prototype.fieldsCount = 0;
vDialog.prototype.childDialog = null;
vDialog.prototype.dialogValueChangeCallback = null;
vDialog.prototype.dialogCloseCallback = null;

/**
 * Initialize objects
 */
vDialog.prototype.init = function(parentDialog){
	if(parentDialog){
		this.parent = parentDialog;
		this.level = parentDialog.getLevel() + 1;
	}
	
	this.jqElement = jQuery('<div class="object-properties" />');
	
	// create arguments cotainers
	this.jqParamsContainer = jQuery('<div class="action-params"></div>');
	this.jqElement.append(this.jqParamsContainer);
	
	vTestMe.appendDialog(this);

	this.jqElement.css("height", vTestMe.testmeHeight - 30);
	this.jqElement.css("left", this.getLevel() * 300);
	this.jqElement.show(1, delegate(this, this.scrollIntoView));
};

vDialog.prototype.clear = function(){
	this.closeChildDialog(true);
	this.jqParamsContainer.empty();
	this.fields = new Object();
	this.fieldsCount = 0;
	this.childDialog = null;
};

vDialog.prototype.getName = function(){
	return this.name;
};

vDialog.prototype.getLevel = function(){
	return this.level;
};

vDialog.prototype.scrollIntoView = function(){
	vTestMe.jqWindow.scrollTo(this.jqElement, 1);
};

vDialog.prototype.closeChildDialog = function(remove){
	if(this.childDialog != null)
		this.childDialog.close(remove);
};

vDialog.prototype.close = function(remove){
	vTestMe.log.debug("[" + this.className + ".close] Closing dialog");
	this.closeChildDialog(remove);
	if(remove){
		this.jqElement.remove();
	}
	else{
		this.jqElement.hide();
	}
	
	if(this.parent != null && this.parent.scrollIntoView)
		this.parent.scrollIntoView();
	
	this.onDialogClose();
};

vDialog.prototype.open = function(){
	vTestMe.log.debug("[vDialog.open] Opening dialog");
	this.jqElement.show();
	this.scrollIntoView();
};

vDialog.prototype.onChildDialogOpen = function(dialog){
	if(this.childDialog != null && this.childDialog != dialog)
		this.childDialog.close(false);
		
	this.childDialog = dialog;
};

vDialog.prototype.onChildDialogClose = function(dialog){
	this.childDialog = null;
};

vDialog.prototype.dialogClose = function(callback) {
	this.dialogCloseCallback = callback;
},

vDialog.prototype.onDialogClose = function(){
	if(this.dialogCloseCallback)
		this.dialogCloseCallback.apply(this, [this]);
};

vDialog.prototype.dialogValueChange = function(callback) {
	if(this.dialogValueChangeCallback != null)
		alert('this.dialogValueChangeCallback');
	
	this.dialogValueChangeCallback = callback;
};

vDialog.prototype.onDialogValueChange = function(dialog){
	if(this.dialogValueChangeCallback)
		this.dialogValueChangeCallback.apply(this, [this]);
};

vDialog.prototype.setParameters = function(parameters){
	this.params = parameters;
	
	if(this.params.name != null)
		this.name = this.params.name;
};

vDialog.prototype.loadFields = function(){
	
	this.clear();
	
	if(this.params != null){
	
		for(var i = 0; i < this.params.length; i++){
			var param = this.params[i];
			var field;
			if (param.isReadOnly)
				continue;
			if (param.isComplexType)
			{
				if (param.isEnum || param.isStringEnum)
					field = new vEnumField(param, this.jqParamsContainer);
				else if (param.isArray)
					field = new vArrayField(param, this.jqParamsContainer, this.getLevel());
				else{
					field = new vObjectField(param, this.jqParamsContainer, this.getLevel());
				}
			}
			else if (param.isFile)
			{
				field = new vFileField(param, this.jqParamsContainer);
			}
			else
			{
				field = new vSimpleField(param, this.jqParamsContainer);
			}
			this.onFieldAdd(field);
		}
	}
};

vDialog.prototype.loadValues = function(object){
	if(object == null)
		return;
	
	if(this.params == null)
		return;
	
	for(var i = 0; i < this.params.length; i++){
		var paramName = this.params[i].name;
		if(this.fields[paramName] && object[paramName])
			this.fields[paramName].setValue(object[paramName]);
	}
};

vDialog.prototype.getField = function(fieldName){
	return this.fields[fieldName];
};

vDialog.prototype.getValue = function(){
	var value = {};
	
	if(this.params != null){
		for(var i = 0; i < this.params.length; i++){
			var paramName = this.params[i].name;
			if(this.fields[paramName] != null)
				value[paramName] = this.fields[paramName].getValue();
		}
	}
	
	return value;
};

vDialog.prototype.onFieldAdd = function(field){
	field.dialogOpen(delegate(this, this.onChildDialogOpen));
	field.dialogClose(delegate(this, this.onChildDialogClose));
	field.valueChange(delegate(this, this.onDialogValueChange));
	field.setParentName(this.name);
	this.fields[field.name] = field;
	this.fieldsCount++;
};

vDialog.prototype.removeRequest = function(removeSubRequestAction){

    if(this.keepRequest)
            return;

    //removing names from field to make sure they won't be submitted
    this.jqParamsContainer.find('input,select').each(function(){
            var field = jQuery(this);
            if(!field.attr('name').length)
                    return;

            if(!removeSubRequestAction && field.hasClass('sub-request-action'))
                    return;

            field.attr('id', field.attr('name'));
            field.removeAttr('name');
    });

    for(var item in this.fields)
    {
            var field = this.fields[item];
            field.removeRequest(removeSubRequestAction);
    }
};

/**
 * Class that represents a single request, as stand alone or as part of multi-request
 * @class vObjectDialog
 */
function vObjectDialog(parent){
	if(parent){
		this.init(parent);
		this.name = parent.getFullName();
	}
}

vObjectDialog.prototype = new vDialog();
vObjectDialog.prototype.className = 'vObjectDialog';
vObjectDialog.prototype.object = {};

vObjectDialog.prototype.onFieldAdd = function(field){
	vDialog.prototype.onFieldAdd.apply(this, arguments);
	field.valueChange(delegate(this, this.onValueChange));
};

vObjectDialog.prototype.loadValues = function(object){
	if(object == null)
		return;
	
	this.object = object;
	
	vDialog.prototype.loadValues.apply(this, arguments);
};

vObjectDialog.prototype.onValueChange = function(field){
	this.object[field.name] = field.getValue();
	this.onDialogValueChange(this);
};

vObjectDialog.prototype.setParameters = function(parameters){
	vDialog.prototype.setParameters.apply(this, arguments);
	
	if(this.object != null)
		this.loadValues(this.object);
};

vObjectDialog.prototype.getValue = function(){
	return this.object;
};


/**
 * Class that represents a single request, as stand alone or as part of multi-request
 * @param vCallLink parent
 * @class vCall
 */
function vCall(parent, index){
	this.name = index;
	
	if(parent)
		this.init(parent);
}

vCall.prototype = new vDialog();
vCall.prototype.className = 'vCall';
vCall.prototype.jqServiceInput = null;
vCall.prototype.jqServiceHelp = null;
vCall.prototype.jqActionInput = null;
vCall.prototype.jqActionHelp = null;

vCall.prototype.getName = function(){
	var serviceId = this.getServiceId();
	var actionId = this.getActionId();	
	return serviceId + '.' + actionId;
};

/**
 * Initialize objects
 * @param vCallLink parent
 */
vCall.prototype.init = function(parent){
	
	vDialog.prototype.init.apply(this, arguments);
	
	// create service parameter
	var jqServiceParam = jQuery('<div class="param"><label for="' + this.name + ':service">Select service:</label></div>');
	this.jqServiceInput = jQuery('<select name="' + this.name + ':service" class="sub-request-action"><option value="">Select service</option></select>');
	this.jqServiceHelp = jQuery('<img src="images/help.png" class="service-help help" />');
	jqServiceParam.append(this.jqServiceInput);
	jqServiceParam.append(this.jqServiceHelp);
	this.jqParamsContainer.before(jqServiceParam);
	
	// create action parameter
	var jqActionParam = jQuery('<div class="param"><label for="' + this.name + ':action">Select action:</label></div>');
	this.jqActionInput = jQuery('<select name="' + this.name + ':action" class="sub-request-action"></select> ');
	this.jqActionHelp = jQuery('<img src="images/help.png" class="action-help help" />');
	jqActionParam.append(this.jqActionInput);
	jqActionParam.append(this.jqActionHelp);
	this.jqParamsContainer.before(jqActionParam);
	
	this.initListeners();
	
	var services = vTestMe.getServices();
	for(var serviceId in services){
		var service = services[serviceId];
		var label = service.name;
		if (service.deprecated)
			label += ' (deprecated)';
		
		this.jqServiceInput.append('<option value="' + service.id + '" title="' + service.name + '">' + label + '</option>');
	}
};
	
/**
 * Initialize objects listeners
 */
vCall.prototype.initListeners = function(){
	this.jqServiceInput.change(delegate(this, this.onServiceChange));
	this.jqActionInput.change(delegate(this, this.onActionChange));
	
	this.onServiceChange();
};

/**
 * Returns textual description of the call
 */
vCall.prototype.getTitle = function(){
	var serviceId = this.getServiceId();
	if(serviceId == 'multirequest')
		return 'Multi-request (' + this.fieldsCount + ')';
		
	return this.jqServiceInput.find('option:selected').text() + '.' + this.jqActionInput.find('option:selected').text();
};

/**
 * Returns the current request data
 */
vCall.prototype.getRequest = function(requestIndex){

	var ret = {
			index: requestIndex,
			fields: this.fields,
			serviceId: this.getServiceId(),
			actionId: this.getActionId(),
			jqParamsContainer: this.jqParamsContainer.clone(true)
	};

	// adding history index class
	vTestMe.jqObjectsContainer.find('input,select').each(function(){
		var field = jQuery(this);
		if(!field.hasClass('history'))
			field.addClass('history history-field' + requestIndex);
	});
	
	ret.jqParamsContainer.find('input,select').each(function(){
		var field = jQuery(this);
		if(!field.attr('name').length)
			return;
			
		field.attr('id', field.attr('name'));
		field.removeAttr('name');
		field.addClass('history-field' + requestIndex);
	});
	
	this.close();
	return ret;
};


/**
 * Set and append request data
 */
vCall.prototype.setRequest = function(request){
	this.close();

	this.removeRequest(true);
	
	// restore input names from their ids
	vTestMe.jqObjectsContainer.find('.history-field' + request.index).each(function(){
		var field = jQuery(this);
		field.removeClass('history');
		if(!field.attr('name').length)
			field.attr('name', field.attr('id'));
	});
	var jqRequestParamsContainer = request.jqParamsContainer.clone(true);
	jqRequestParamsContainer.find('.history-field' + request.index).each(function(){
		var field = jQuery(this);
		field.attr('name', field.attr('id'));
	});

	this.keepRequest = true;
	this.setAction(request.serviceId, request.actionId);
	this.fields = request.fields;
	this.keepRequest = false;
	
	this.jqParamsContainer.remove();
	this.jqParamsContainer = jqRequestParamsContainer;
	this.jqElement.append(this.jqParamsContainer);
	this.jqParamsContainer.show();
};

vCall.prototype.getValue = function(){
	var value = vDialog.prototype.getValue.apply(this, arguments);

	value['service'] = this.getServiceId();
	value['action'] = this.getActionId();
	
	return value;
};

/**
 * Returns the current request dialon level
 */
vCall.prototype.getLevel = function(){
	return 1;
};

/**
 * Return the service select box value
 */
vCall.prototype.getServiceId = function(){
	return this.jqServiceInput.val();
};

/**
 * Set the service select box value
 * @param string serviceId
 */
vCall.prototype.setServiceId = function(serviceId){
	if(serviceId != null)
		this.jqServiceInput.val(serviceId);
};

vCall.prototype.isMultiRequest = function(){
	return (this.getServiceId() == 'multirequest');
};

/**
 * Return the service name
 */
vCall.prototype.getService = function(){
	var serviceId = this.getServiceId();
	var serviceParts = serviceId.split('_');
	if(serviceParts.length == 1)
		return serviceId;
	
	if(serviceParts.length == 2)
		return serviceParts[1];
	
	return null;
};

/**
 * Return the plugin name
 */
vCall.prototype.getPlugin = function(){
	var serviceId = this.getServiceId();
	var serviceParts = serviceId.split('_');
	if(serviceParts.length == 2)
		return serviceParts[0];
	
	return null;
};

/**
 * Set the service and action
 */
vCall.prototype.setAction = function(serviceId, actionId){
	vTestMe.log.debug("[vCall.setAction] service [' + serviceId + '] action [' + actionId + ']");
	
	if(serviceId == null){
		vTestMe.log.error("[vCall.setAction] invalid service id");
		return;
	}
	
	this.jqServiceInput.val(serviceId);
	this.onServiceChange(actionId);
};

/**
 * Lock the service select box and return its value
 */
vCall.prototype.getLockedServiceId = function(){
	this.jqServiceInput.attr('disabled', true);
	return this.getServiceId();
};

/**
 * Unlock the service select box and return its value
 */
vCall.prototype.getUnLockedServiceId = function(){
	var serviceId = this.jqServiceInput.val();
	this.jqServiceInput.attr('disabled', false);
	return serviceId;
};

/**
 * Return the action select box value
 */
vCall.prototype.getActionId = function(){
	return this.jqActionInput.val();
};

/**
 * Set the action select box value
 */
vCall.prototype.setActionId = function(actionId){
	if(actionId != null)
		this.jqActionInput.val(actionId);
};

/**
 * Lock the action select box and return its value
 */
vCall.prototype.getLockedActionId = function(){
	this.jqActionInput.attr('disabled', true);
	return this.getActionId();
};

/**
 * Unlock the action select box and return its value
 */
vCall.prototype.getUnLockedActionId = function(){
	var actionId = this.jqActionInput.val();
	this.jqActionInput.attr('disabled', false);
	return actionId;
};

vCall.prototype.ready = function(callback){
	this.readyCallback = callback;
};

vCall.prototype.onServiceChange = function(actionId){
	var serviceId = this.getLockedServiceId();
	
	if(serviceId == ""){
		this.onActionsListFail();
		return;
	}

	this.loadActionId = actionId;
	this.jqActionInput.attr('disabled', true);
	if(vTestMe.serviceActionsLoaded(serviceId)){
		this.loadActionsList();
		return;
	}
	
	this.jqActionInput.empty();
	this.jqActionInput.append('<option>Loading...</option>');

	jQuery.ajax({
		url: 'json/' + serviceId + '-actions.json', 
		dataType: 'json',
		success: delegate(this, this.onActionsListLoad),
		error: delegate(this, this.onActionsListFail)
	});
};

vCall.prototype.onActionsListFail = function(){
	this.getUnLockedServiceId();
	this.jqActionInput.parent().hide();
	this.clear();
};

vCall.prototype.onActionsListLoad = function(data){
	var serviceId = this.getLockedServiceId();

	jQuery.each(data, delegate(this, function (index, item) {
		vTestMe.registerAction(serviceId, item.action, item.name, item.label);
	}));

	this.loadActionsList();
};

vCall.prototype.loadActionsList = function(){
	var serviceId = this.getUnLockedServiceId();

	this.jqActionInput.parent().show();
	this.jqActionInput.empty();
	
	var actions = vTestMe.getServiceActions(serviceId);
	for(var actionId in actions){
		if(actionId == 'length')
			continue;
		
		var action = actions[actionId];
		this.jqActionInput.append('<option value="' + action.id + '" title="' + action.name + '">' + action.label + '</option>');
	}
	this.jqActionInput.attr('disabled', false);
	
	if(this.loadActionId){
		this.setActionId(this.loadActionId);
		this.loadActionId = null;
	}
	
	if(actions.length)
		this.onActionChange();
};

vCall.prototype.clear = function(){
	vDialog.prototype.clear.apply(this, arguments);
};

vCall.prototype.onActionChange = function(){
	var serviceId = this.getLockedServiceId();
	var actionId = this.getLockedActionId();
	
	this.removeRequest(false);
	if(vTestMe.actionParamsLoaded(serviceId, actionId)){
		this.loadActionParams();
		return;
	}
	
	this.clear();
	this.jqParamsContainer.append('<span>Loading...</span>');

	jQuery.getJSON(
		'json/' + serviceId + '-' + actionId +'-action-info.json',
		delegate(this, this.onActionParamsLoad)
	);
};

vCall.prototype.onActionParamsLoad = function(data){
	var serviceId = this.getLockedServiceId();
	var actionId = this.getLockedActionId();
	
	this.jqActionHelp.attr('title', serviceId + '.' + actionId + ' - ' + (data ? data.description : ''));
	this.closeChildDialog(true);
	
	jQuery.each(data.actionParams, delegate(this, function (index, param) {
		vTestMe.registerActionParam(serviceId, actionId, param);
	}));
	
	this.jqActionHelp.tooltip({showURL: false, delay: 0, extraClass: 'helpTooltip', showBody: ' - '});
	this.loadActionParams();
};

vCall.prototype.loadActionParams = function(){
	var serviceId = this.getUnLockedServiceId();
	var actionId = this.getUnLockedActionId();
	var params = vTestMe.getActionParams(serviceId, actionId);
	if(params)
		this.setParameters(params);
	this.loadFields();

	if(vTestMe.call.readyCallback)
		vTestMe.call.readyCallback.apply(this, [this]);
};

/**
 * Class that represents the first request, as stand alone or as multi-request container
 * @class vMainCall
 * @param id the id of the html element that contains all the request attributes.
 */
function vMainCall(id){
	this.name = null;
	this.jqElement = jQuery('#' + id);

	this.jqServiceInput = this.jqElement.find('select[name=service]');
	this.jqServiceHelp = this.jqElement.find('.service-help');
	this.jqActionInput = this.jqElement.find('select[name=action]');
	this.jqActionHelp = this.jqElement.find('.action-help');
	this.jqParamsContainer = this.jqElement.find('.action-params');
	this.jqAddCall = this.jqElement.find('.add-request-button');
	
	var scope = this;
	jQuery('.param').each(function(index, item){
		var jqParam = jQuery(item);
		var field;
		
		if(jqParam.find('select').size() > 0){
			field = new vEnumField();
		}
		else{
			field = new vSimpleField();
		}
		field.load(jqParam);
		scope.onFieldAdd(field);
	});
	this.initListeners();
}

vMainCall.prototype = new vCall();
vMainCall.prototype.className = 'vMainCall';
vMainCall.prototype.jqAddCall = null;

vMainCall.prototype.getName = function(){
	var serviceId = this.getServiceId();
	
	if(serviceId == 'multirequest')
		return 'multirequest';
	
	return vCall.prototype.getName.apply(this, arguments);
};

vMainCall.prototype.close = function(remove){
	this.closeChildDialog(remove);
};

vMainCall.prototype.initListeners = function(){
	vCall.prototype.initListeners.apply(this, arguments);
	
	this.jqAddCall.click(delegate(this, this.addCall));
};

vMainCall.prototype.addCall = function(){
	var field = new vCallLink(this.jqParamsContainer);
	this.onFieldAdd(field);
};

vMainCall.prototype.onChildDialogOpen = function(dialog){
	if(this.childDialog != null && this.childDialog != dialog)
		this.childDialog.close(false);
		
	this.childDialog = dialog;
};

vMainCall.prototype.onServiceChange = function(actionId){
	var serviceId = this.getLockedServiceId();
	
	if(serviceId == 'multirequest'){
		this.initMultirequest();
		this.getUnLockedServiceId();

		if(this.readyCallback)
			this.readyCallback.apply(this, [this]);
	}
	else{
		this.jqAddCall.parent().hide();
		vCall.prototype.onServiceChange.apply(this, arguments);
	}
};

vMainCall.prototype.getLevel = function(){
	return 0;
};

vMainCall.prototype.initMultirequest = function(){
	this.jqAddCall.parent().show();
	this.jqActionInput.parent().hide();
	this.clear();
};
