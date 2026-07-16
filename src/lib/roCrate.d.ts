export interface RoCrateServiceDefinition {
    name: string;
    description: string;
    fdlUrl: string;
    scriptUrl: string;
    author: string;
    type: Array<string>;
    iconUrl: string;
    memoryRequirements: string;
    memoryUnits: string;
    cpuRequirements: string;
    gpuRequirements: string;
    
    kserveMemoryRequirements?: string;
    kserveMemoryUnits?: string;
    kserveCpuRequirements?: string;
    kserveGpuRequirements?: string;
}

export interface RoCrateAgentServiceDefinition {
    name: string;
    description: string;
    fdlUrl: string;
    scriptUrl: string;
    author: string;
    type: Array<string>;
    iconUrl: string;
    memoryRequirements: string;
    memoryUnits: string;
    cpuRequirements: string;
    gpuRequirements: string;
    agentSoulUrl: string;
    agentSkillUrl: Array<string>;
    agentType: "exposed" | "on-demand",
}

/**
 * Parses the RO-Crate data and returns an array of service definitions.
 * @returns {Promise<RoCrateServiceDefinition[]>} A promise that resolves to an array of service definitions.
 */
declare const parseROCrateDataJS: (githubUser: string, githubRepo: string, githubBranch: string, validate = false) => Promise<RoCrateServiceDefinition[]>;

/**
 * Parses the OSCAR Agents RO-Crate data and returns an array of service definitions.
 * @returns {Promise<RoCrateAgentServiceDefinition[]>} A promise that resolves to an array of service definitions.
 */
declare const parseAgentsROCrateDataJS: (githubUser: string, githubRepo: string, githubBranch: string, validate = false) => Promise<RoCrateAgentServiceDefinition[]>;

//export default parseROCrateDataJS;
export { parseROCrateDataJS, parseAgentsROCrateDataJS };