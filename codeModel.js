/*
    "module" es un objeto que contiene laa funciones outputValue, outputs y allOutputs
    "outputValue" es una funcion que recibe como argumentos, un string y una funcion 
    "outputs" es una funcion que retorna un objeto con N cantidad de llaves unicamene a nivel del módulo actual, no de campos.
    "allOutputs" es una funcion que retorna un objeto con N cantidad de llaves de todos los campos del módulo. 
    "ko" es un objeto global de KnockoutJS que contiene las funciones computed y pureComputed propias de KnockoutJS

*/
module.outputValue("customOutput", ko.pureComputed(() => { 
    let allOutputs = module.allOutputs() 
    let result = "";
    if ("key" in allOutputs && allOutputs["key"]()) {
        let outputValue = allOutputs["key"]();
        if (Array.isArray(outputValue)) {
            result = outputValue.join(", ");
        }
        result = outputValue;
    }
    return result;
}))