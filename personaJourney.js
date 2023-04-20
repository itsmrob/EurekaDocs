const currentCohortId = _group.cohort_id;

let stypes = ko.computed(() => {
    let types = {
        sthrType1: '', 
        sthrType2: '' 
    }
    if ('stakeholderTypes' in module.outputs() && module.outputs()['stakeholderTypes']().length) {
        let { 
            sthrType1, 
            sthrType2 
        } = module.outputs()['stakeholderTypes']()[0];
        
        types.sthrType1 = sthrType1;
        types.sthrType2 = sthrType2;
    }
    return types;
});

module.outputValue('journeyComplete', ko.computed(function() {
    var values = [];
    var outputs = module.allOutputs();
    
    var initiativeText = "";
    
    if ('initiativeTitle' in outputs && outputs['initiativeTitle']()) {
        outputs['initiativeTitle']().forEach(value => {
            value.forEach(v => {
                if (v._id == module.item) {
                    initiativeText = v.value;
                }
            });
        });
    }
    
    var somewhatData = [];
    if ('journey:somewhatData' in outputs && outputs['journey:somewhatData']()) {
        outputs['journey:somewhatData']().forEach(v => {
            somewhatData.push(Object.assign(v, { initiative: initiativeText }));
        });
    }
    
    var unsafedata = [];
    if ('journey:unsafeData' in outputs && outputs['journey:unsafeData']()) {
        outputs['journey:unsafeData']().forEach(v => {
            unsafedata.push(Object.assign(v, { initiative: initiativeText }));
        });
    }
    
    return somewhatData.concat(unsafedata);
}));

module.outputValue("journeyStatus", ko.computed(function() {
    const journeyOutputs = ['journey:numSafe', 'journey:numSomewhat', 'journey:numUnsafe', 'journey:numNotSafe'];
    
    let result = {
        _id: '',
        service_id: '',
        safe: 0,
        unsafe: 0,
        somewhat: 0,
        service: '',
        stakeholderType: '',
        painpoint: '',
        
    };
    
    if ('param_service_id' in module.outputs() && module.outputs()['param_service_id']()) {
        result['service_id'] = module.outputs()['param_service_id']();
    }     
    
    if ('param_item' in module.outputs() && module.outputs()['param_item']()) {
        result['_id'] = module.outputs()['param_item']();
    }    
    
    journeyOutputs.forEach(output => {
        if (output in module.allOutputs() && module.allOutputs()[output]()) {
            let key = output.split(':')[1]?.substring(3).toLowerCase();
            if (key) {
                result[key] = module.allOutputs()[output]();
            }
        }
    });
    
    if ('service:renderedContent' in module.allOutputs() && module.allOutputs()['service:renderedContent']()) {
        result['service'] = module.allOutputs()['service:renderedContent']();
    }
    
    if ('stakeholderType:renderedContent' in module.allOutputs() && module.allOutputs()['stakeholderType:renderedContent']()) {
        result['stakeholderType'] = module.allOutputs()['stakeholderType:renderedContent']();
    } 
    
    return result;
}));

module.outputValue("journeyTable", ko.computed(() => {
    let serviceId = '';
    if ('param_service_id' in module.outputs() && module.outputs()['param_service_id']()) {
        serviceId = module.outputs()['param_service_id']();
    }     
    let rows = [];
    if ('journey:table' in module.allOutputs() && module.allOutputs()['journey:table']()) {
        module.allOutputs()['journey:table']().forEach(step => {
            let row = {
                ...step,
                'service_id': serviceId
            };
            rows.push(row);
        })
    }
    return rows;
}));

const statusLabel = { //status label translation
    def: {
        safe: 'Great',
        unsafe: 'Not Good',
        somewhat: 'Could Be Improved',
    },
    en_US: {
        safe: 'Great',
        unsafe: 'Not Good',
        somewhat: 'Could Be Improved',
    },   
    es_ES: { //type here spanish translation
        safe: '',
        unsafe: '',
        somewhat: '',
    }    
};

module.outputValue("journeyPainpoints", ko.computed(function() {
    let currentService = "";
    if ('service:renderedContent' in module.allOutputs() && module.allOutputs()['service:renderedContent']()) {
        currentService = module.allOutputs()['service:renderedContent']().replace(/(<([^>]+)>)/gi, ""); 
    }
    
    let currentServiceId = "";
    if ('param_service_id' in module.outputs() && module.outputs()['param_service_id']()) {
        currentServiceId = module.outputs()['param_service_id']();
    }    
    
    let currentStakeholderName = "";
    if ('param_stakeholderName' in module.outputs() && module.outputs()['param_stakeholderName']()) {
        currentStakeholderName = module.outputs()['param_stakeholderName']();
    }
    
    let currentStakeholderType = "";
    if ('param_stakeholderType' in module.outputs() && module.outputs()['param_stakeholderType']()) {
        currentStakeholderType = module.outputs()['param_stakeholderType']();
    }
    
    let availableServicesIDs = [];
    if ('availableServicesIDs' in module.outputs() && module.outputs()['availableServicesIDs']().length) {
        availableServicesIDs = availableServicesIDs.concat(module.outputs()['availableServicesIDs']()[0]);
    }
    
    let stakeholdersIds = [];
    if ('developPersonaData' in module.outputs() && module.outputs()['developPersonaData']().length) {
        stakeholdersIds = stakeholdersIds.concat(module.outputs()['developPersonaData']()[0].map(p => p._id));
    }     
    let currentItem = "";
    if ('param_item' in module.outputs() && module.outputs()['param_item']()) {
        currentItem = module.outputs()['param_item']();
    }
    
    let result = [];
    
    if (stakeholdersIds.indexOf(currentItem) > -1 && availableServicesIDs.indexOf(currentServiceId) > -1) {
        if ('painpointSummary:value' in module.allOutputs() && module.allOutputs()['painpointSummary:value']().length) {
            module.allOutputs()['painpointSummary:value']().forEach(value => {
                let data = {
                    _id: value._id,
                    service_id: currentServiceId || "",
                    item_id: currentItem,
                    activity: value.title || "",
                    service: currentService,
                    stakeholderName: currentStakeholderName,
                    stakeholderType: currentStakeholderType,
                    painpoint: value.pointpoint || "",
                    tags: value.painpointTags || "",
                    solution: value.solution || "",
                    status: '',
                    num: value.num || '',
                    parentStep: value.parentStep || "",
                };
                if ('status' in value) {
                    if (value.status == 'somewhat') {
                        data.status = statusLabel[module.lang].somewhat;
                    }
                    if (value.status == 'unsafe') {
                        data.status = statusLabel[module.lang].unsafe;
                    }
                } 
                result.push(data);
            });
        }
    }
    return result;
}));

/*---Safe Journey---*/

module.outputValue("safeJourney", ko.computed(function() {
    let currentService = "";
    if ('service:renderedContent' in module.allOutputs() && module.allOutputs()['service:renderedContent']()) {
        currentService = module.allOutputs()['service:renderedContent']().replace(/(<([^>]+)>)/gi, ""); 
    }
    
    let currentStakeholderType = "";
    if ('param_stakeholderType' in module.outputs() && module.outputs()['param_stakeholderType']()) {
        currentStakeholderType = module.outputs()['param_stakeholderType']();
    }
    
    let item = "";
    if ('param_item' in module.outputs() && module.outputs()['param_item']()) {
        item = module.outputs()['param_item']();
    }    
    
    let result = [];
    if ('journey:safeData' in module.allOutputs() && module.allOutputs()['journey:safeData']().length) {
        module.allOutputs()['journey:safeData']().forEach(value => {
            let data = {
                _id: value._id,
                activity: value.title || "",
                service: currentService,
                item_id: item,
                stakeholderType: currentStakeholderType,
                status: '',
                num: value.num || 0
            };
            if ('status' in value) {
                if (value.status == 'safe') {
                    data.status = statusLabel[module.lang].safe;
                }
            } 
            result.push(data);
        });
    }
    return result;
}));

/*---red steps---*/

module.outputValue("unsafeSteps", ko.computed(function() {
    let currentService = "";
    if ('service:renderedContent' in module.allOutputs() && module.allOutputs()['service:renderedContent']()) {
        currentService = module.allOutputs()['service:renderedContent']().replace(/(<([^>]+)>)/gi, ""); 
    }
    
    let currentStakeholderType = "";
    if ('param_stakeholderType' in module.outputs() && module.outputs()['param_stakeholderType']()) {
        currentStakeholderType = module.outputs()['param_stakeholderType']();
    }
    
    let item = "";
    if ('param_item' in module.outputs() && module.outputs()['param_item']()) {
        item = module.outputs()['param_item']();
    }        
    
    let result = [];
    if ('painpointSummary:value' in module.allOutputs() && module.allOutputs()['painpointSummary:value']().length) {
        module.allOutputs()['painpointSummary:value']().filter(v => v.status && v.status == 'unsafe').forEach(value => {
            let data = {
                _id: value._id,
                activity: value.title || "",
                service: currentService,
                item_id: item,
                stakeholderType: currentStakeholderType,
                painpoint: value.pointpoint || "",
                solution: value.solution || "",
                num: value.num || "",
            };
            if ('status' in value) {
                if (value.status == 'unsafe') {
                    data.status = statusLabel[module.lang].unsafe;
                }
            } 
            result.push(data);
        });
    }
    return result;
}));

/*---yellow steps---*/

module.outputValue("somewhatSteps", ko.computed(function() {
    let currentService = "";
    if ('service:renderedContent' in module.allOutputs() && module.allOutputs()['service:renderedContent']()) {
        currentService = module.allOutputs()['service:renderedContent']().replace(/(<([^>]+)>)/gi, ""); 
    }
    
    let currentStakeholderType = "";
    if ('param_stakeholderType' in module.outputs() && module.outputs()['param_stakeholderType']()) {
        currentStakeholderType = module.outputs()['param_stakeholderType']();
    }
    
    let item = "";
    if ('param_item' in module.outputs() && module.outputs()['param_item']()) {
        item = module.outputs()['param_item']();
    }    
    
    let result = [];
    if ('painpointSummary:value' in module.allOutputs() && module.allOutputs()['painpointSummary:value']().length) {
        module.allOutputs()['painpointSummary:value']().filter(v => v.status && v.status == 'somewhat').forEach(value => {
            let data = {
                _id: value._id,
                activity: value.title || "",
                service: currentService,
                item_id: item,
                stakeholderType: currentStakeholderType,
                painpoint: value.pointpoint || "",
                solution: value.solution || "",
                num: value.num || "",
            };
            if ('status' in value) {
                if (value.status == 'somewhat') {
                    data.status = statusLabel[module.lang].somewhat;
                }
            } 
            result.push(data);
        });
    }
    return result;
}));

/*---Yellow steps---*/

module.outputValue('progress', ko.pureComputed(function() {
    if ('personaDashboard:percentageCompleted' in module.allOutputs()) {
        return parseInt(module.allOutputs()['personaDashboard:percentageCompleted']() * 100); 
    }
    return 0;
}));

module.outputValue('progressDashboard', ko.pureComputed(function() {
    if ('personaDashboard:percentageCompleted' in module.allOutputs()) {
        return parseInt(module.allOutputs()['personaDashboard:percentageCompleted']() * 100); //duplicated output function (see above)
    }
    return 0;
}));

module.outputValue("exportTableData", ko.pureComputed(function() {
    let currentServiceId = "";
    if ('param_service_id' in module.outputs() && module.outputs()['param_service_id']()) {
        currentServiceId = module.outputs()['param_service_id']();
    }
    
    if ('developPersonaData' in module.outputs() && module.outputs()['developPersonaData']().length) {
        return module.outputs()['developPersonaData']()[0].filter(value => {
            if ('service' in value) {
                return 'service_id' in value && value.service_id == currentServiceId;
            }
            return false;
        })
    } 
    return [];
}))

module.outputValue("exportableData", ko.pureComputed(function() {
    let outputs = module.allOutputs();
    let fields = [
        'personaName:value',
        'personaNameCitizen:value',
        'role:value',
        'personaPhoto:value',
        'gender:valuesWithIDs',
        'age:value',
        'location:valuesWithIDs',
        'ethnicity:valuesWithIDs',
        'education:valuesWithIDs',
        'familyStatus:valuesWithIDs',
        'socialStatus:valuesWithIDs',
        'activities:valuesWithIDs',
        'trigger:valuesWithIDs',
        'fears:valuesWithIDs',
        'challenges:valuesWithIDs',
        'influencers:valuesWithIDs',
        'needs:valuesWithIDs',
        'description:value',
        'journey:allValues',
        'painpointSummary:value',
        'service:renderedContent',
        'stakeholderType:renderedContent',
        'exportTable:value',
        'exportDepartment:renderedContent',
        'exportDepartmentHead:renderedContent',
        'exportServiceType:renderedContent',
        'exportTotal:renderedContent',
        'exportType:renderedContent',
        'exportIcon:renderedContent',
        'generation:valuesWithIDs',
        'socialStatus:valuesWithIDs',
        'triggerCitizen:valuesWithIDs',
        'activitiesCitizen:valuesWithIDs',
        'roleCitizen:value',
        'personaPhotoCitizen:value',
        'exportTable:value',
        'governmentPersona1:value',
        'governmentPersona2:value',
        'jobDescription:value',
        'exportGreen:value',
        'exportYellow:value',
        'exportRed:value',
        'peopleInvolve:value',
        'exportCost:renderedContent',
        'exportDuration:renderedContent',
        'exportComplexity:renderedContent',
        'exportResponsibles:renderedContent'
    ];
    
    let data = {};
    
    if ('param_item' in module.outputs() && module.outputs()['param_item']()) {
        data['_id'] = module.outputs()['param_item']();
    }
    
    if ('param_service_id' in module.outputs() && module.outputs()['param_service_id']()) {
        data['service_id'] = module.outputs()['param_service_id']();
    }    
    
    if ('param_stakeholderType' in module.outputs() && module.outputs()['param_stakeholderType']()) {
        data['stakeholderType'] = module.outputs()['param_stakeholderType']();
    }    

    fields.forEach(currentField => {
        if (currentField in outputs && (outputs[currentField]() || outputs[currentField]() == 0)) {
            let key = currentField.split(":")[0];
            if (!(key in data)) {
                data[key] = outputs[currentField]();
            }
        }
    })
    return data;
}));

const getServicesData = () => { // retrieve data from describeService:value (1.1.11) table available in module 1
    let currentServiceId = "";
    if ('param_service_id' in module.outputs() && module.outputs()['param_service_id']()) {
        currentServiceId = module.outputs()['param_service_id']();
    }
    
    let data = {};
    if ('describeServiceData' in module.outputs() && module.outputs()['describeServiceData']()) {
        let find = module.outputs()['describeServiceData']()[0].filter(value => {
            return value._id == currentServiceId;
        });
        if (find.length) data = find[0] || {};
    }
    return data;    
}

module.outputValue("getImage", ko.pureComputed(function() {
    return getServicesData().image || "";
}));

module.outputValue("getServiceName", ko.pureComputed(function() {
    return getServicesData().serviceName || "";
}));

module.outputValue("KPIData", ko.pureComputed(function() {
    let outputs = module.allOutputs();
    
    let currencyByCohort = {
        "63a626710ed2b60019948725": "QR"
    }
    
    let cohortId = _group.cohort_id;
    
    let result = {
        'complexity': 'Low', //these lines of text must be translated to spanish and english
        'duration': '0 hours',
        'cost': 0,
        'currency': currencyByCohort[cohortId] || "USD"
    }
    
    if ('journey:allValues' in outputs && outputs['journey:allValues']().length) {
        let allValues = outputs['journey:allValues']();
        
        if (allValues.length) {
            let cost = allValues.reduce((total, current) => {
                if ('cost' in current) {
                    if (current.cost.indexOf('$') > -1) {
                        let totalCost = current.cost.split('').filter(n => n !== '$').join("");
                        total+= parseInt(totalCost || 0);
                    } else {
                        total+= parseInt(current.cost || 0);
                    }
                }
                return total;
            }, 0);
            
            let complexity = allValues.reduce((complexity, current) => {
                let complexityValues = {
                    'low': 1,
                    'medium': 2,
                    'high': 3
                }            
                if ('complexity' in current) {
                    complexity+= complexityValues[current['complexity'] && current['complexity'].trim()] || 1;
                } else {
                    complexity+=1;
                }
                return complexity;
            }, 0);
            
            let results = { 1: 'Low', 2: 'Medium', 3: 'High', }
            
            let complexityResult = results[Math.ceil(complexity / allValues.length)];
            
            result.complexity = complexityResult;
            result.cost = cost;
            
            let hoursTotal = 0;
            allValues.forEach(value => {
                if ('duration' in value && 'durationScale' in value) {
                    if (value.durationScale) {
                        if (value.durationScale == 'm') {
                            let minToHours = parseFloat((value.duration / 60).toFixed(2));
                            hoursTotal+= minToHours;
                        } 
                        
                        if (value.durationScale == 'h') {
                            hoursTotal+= parseFloat(value.duration);
                        } 
                        
                        if (value.durationScale == 'd') {
                            let dayToHours = parseFloat((value.duration * 24));
                            hoursTotal+= dayToHours;
                        }
                        
                        if (value.durationScale == 'w') {
                            let dayToHours = parseFloat((value.duration * 168));
                            hoursTotal+= dayToHours;
                        }
                    }
                }
            });
            result.duration = hoursTotal > 24 ? `${parseFloat((hoursTotal/24).toFixed(2))} days` : `${parseFloat((hoursTotal).toFixed(2))} hours`; 
        }
    }
    return result;
}));

module.outputValue("peopleInvolved", ko.pureComputed(function() {
    let outputs = module.allOutputs();    
    let result = 0;
    if ('journey:responsibles' in outputs && outputs['journey:responsibles']()) {
        let findResponsibles = outputs['journey:responsibles']().filter(r => {
            return 'name' in r && (r.name !== null && typeof r.name !== 'undefined');
        });
        if (currentCohortId == "63a626710ed2b60019948725") {
            result = findResponsibles.length;
        }        
    }
    return result;
}));

module.outputValue("entityName1", ko.pureComputed(function() {
    if ("entityName" in module.outputs() && module.outputs()['entityName']().length) {
        return module.outputs()['entityName']()[0];
    }
    return "";
}));

module.outputValue("isServiceProvider", ko.pureComputed(function() {
    let serviceProvider = false;
    // if ('param_stakeholderType' in module.outputs() && module.outputs()['param_stakeholderType']()) {
    //     serviceProvider = module.outputs()['param_stakeholderType']() && module.outputs()['param_stakeholderType']().trim() == "Service Provider";
    // }
    return serviceProvider = true;
}))

module.outputValue('requiredFilled', ko.pureComputed(function() {
    /*
        if Service Provider or Government required tables only 
        If Citizen or something else, custom fields required (list, text, etc)
    */
    let otp = module.allOutputs();
    let filled = 0;
    let totalRequired = 0;

    // let requiredString = ['personaName:value', 'role:value', 'personaPhoto:value', 'jobDescription:value'];
    // let requiredList = ['activities:valuesWithIDs', 'trigger:valuesWithIDs', 'challenges:valuesWithIDs'];
    
    let requiredString = [];
    let requiredList = [];
    let requiredTables = ['governmentPersona1:value', 'governmentPersona2:value'];

    if ('param_stakeholderType' in otp && otp['param_stakeholderType']()) {
        
        let currentType = otp['param_stakeholderType']();
        let { sthrType1 } = stypes();
        if (currentType && (currentType.trim() != 'Service Provider' && currentType.trim() != sthrType1)) { //sthrType1 may be government or service provider
            requiredString = ['personaNameCitizen:value', 'roleCitizen:value', 'personaPhotoCitizen:value', 'age:value', 'description:value'];
            requiredList = ['activitiesCitizen:valuesWithIDs', 'triggerCitizen:valuesWithIDs', 'fears:valuesWithIDs', 'influencers:valuesWithIDs', 'needs:valuesWithIDs', 'gender:selectedIDs', 'ethnicity:selectedIDs', 'generation:selectedIDs', 'education:selectedIDs', 'location:selectedIDs', 'familyStatus:selectedIDs', 'socialStatus:selectedIDs'];
    
            for (r of requiredString) {
                if (otp[r] && otp[r]() && otp[r]().trim()) filled++;
            }
            
            for (r of requiredList) {
                if (otp[r] && otp[r]() && otp[r]().length > 0) filled++;
            }
            
            totalRequiredField = requiredString.length + requiredList.length;
        }
        
        for (r of requiredTables) {
            if (otp[r] && otp[r]() && otp[r]().length > 0) filled++;
        }        
    }

    totalRequiredField = requiredTables.length;
    // console.log('requiredFilled', filled == totalRequiredField)
    return filled == totalRequiredField;
}));

module.outputValue("personasName", ko.pureComputed(function() {
    let outputs = module.allOutputs();
    
    let stakeholderType = "";
    if ('param_stakeholderType' in outputs && outputs['param_stakeholderType']()) {    
        stakeholderType = outputs['param_stakeholderType']();
    }
    
    let { sthrType1 } = stypes();
    
    let field = (stakeholderType && stakeholderType.trim()) == sthrType1 ? "stakeholderName:value" : "personaNameCitizen:value"; //sthrType1 may be government or service provider
    
    if (field in outputs && outputs[field]()) {
        return outputs[field]();
    }
    return "";
}));

module.outputValue("personasProgress", ko.pureComputed(() => {
    if ('personaDashboard:percentageCompleted' in module.allOutputs()) {
        // return parseInt(module.allOutputs()['personaDashboard:percentageCompleted']() * 100); 
    }
    // return 0;   
    
    return {};
}));

module.outputValue("govermentPersonaInfo", ko.pureComputed(function() {
    let outputs = module.allOutputs();
    
    let personas = {};
    if ('governmentPersona2:value' in outputs && outputs['governmentPersona2:value']()) {
        outputs['governmentPersona2:value']().forEach(p => {
            let key = "";
            if ('responsible' in p && p.responsible) {
                key = p.responsible && p.responsible.trim().toLowerCase();
                if (key && !(key in personas)) {
                    personas[key] = {
                        '_id': key,
                        'responsible': '',
                        'responsiblePosition': '',
                        'numberStep': ''                    
                    }
                }
            }
            
            if (key && key in personas) {
                personas[key]._id = key;
                personas[key].responsible = p.responsible;
                personas[key].responsiblePosition = p.responsiblePosition;
                personas[key].numberStep = personas[key].numberStep ? personas[key].numberStep + ', ' + p.num : p.num;
            }
        })
    }
    
    let personasList = [];
    Object.keys(personas).forEach(persona => {
        personasList.push(personas[persona]);
    })
    return personasList;
}));

module.outputValue("journeyMapDescription", ko.pureComputed(() => { //sthrType1 may be government or service provider
    let stakeholderType = "";
    if ('param_stakeholderType' in module.outputs() && module.outputs()['param_stakeholderType']()) {    
        stakeholderType = module.outputs()['param_stakeholderType']();
    }
    let { sthrType1 } = stypes();
    if (sthrType1 == stakeholderType) {
        return "<h3>Service Provider Map:</h3>Service Provider Journey Map usually starts "+
        " when the citizens first introduces the request to the Service Provider";
    }
    return "<h3>Service User Journey Map:</h3> Service User Journey Map usually starts when there is need to be fulfilled from a particular service";
}));

module.outputValue("participantInformation", ko.pureComputed(() => {
    let item = '';
    if ('param_item' in module.outputs() && module.outputs()['param_item']()) {    
        item = module.outputs()['param_item']();
    }
    
    let stakeholderType = '';
    if ('param_stakeholderType' in module.outputs() && module.outputs()['param_stakeholderType']()) { 
        stakeholderType = module.outputs()['param_stakeholderType']();
    }   
    
    let personName = "";
    if ('personaNameCitizen:value' in module.allOutputs() && module.allOutputs()['personaNameCitizen:value']()) { 
        personName = module.allOutputs()['personaNameCitizen:value']();
    }      
    
    let { sthrType1, sthrType2 } = stypes();
    
    let information = {
        _id: item,
        participantName: sthrType1
    }
    if (stakeholderType == sthrType2) {
        information.participantName  = personName;
    }
    return [information];
