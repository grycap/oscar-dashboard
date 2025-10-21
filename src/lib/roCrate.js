import { ROCrate, Validator } from 'ro-crate';

const RoCrateServiceDefinition = {
    name: "",
    description: "",
    fdlUrl: "",
    scriptUrl: "",
    author: "",
    type: "",
    iconUrl: "https://oscar.grycap.net/images/oscar3-logo-trans.png",
    memoryRequirements: "2",
    memoryUnits: "Mi",
    cpuRequirements: "1",
    gpuRequirements: "0",
};

export default async function parseROCrateDataJS(githubUser, githubRepo, githubBranch) {
  // Define the GitHub repository details
  // Replace with your GitHub username, repository name, and branch
  const user = githubUser;
  const repo = githubRepo;
  const branch = githubBranch;
  const githubUrl = `https://api.github.com/repos/${user}/${repo}/git/trees/${branch}?recursive=1`;

  const fetchFromGitHubOptions = {
    method: 'GET',
    cache: 'no-cache',
    headers: {
      'Accept': 'text/plain, application/x-yaml, */*'
    }
  };
  
  // Fetch the list of files in the GitHub repository
  const res = await fetch(githubUrl, fetchFromGitHubOptions);
  const data = await res.json();

  // Filter for ro-crate-metadata.json files (folder/fileName)
  var files = data.tree.filter((item) => item.type === 'blob' && item.path.includes('ro-crate-metadata.json'));

  var serviceList = [];
  // Process each ro-crate-metadata.json file
  for (const file of files) {
    var service = { ...RoCrateServiceDefinition };
    const baseRawFileUrl = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/`;

    // Fetch the content of the file
    const fileUrl = baseRawFileUrl + file.path;
    const folderRawFileUrl = fileUrl.replace('ro-crate-metadata.json', '');
    
    try {
      const response = await (await fetch(fileUrl, fetchFromGitHubOptions)).json();
      // Create a new ROCrate instance
      const crate = new ROCrate(response, { array: false, link: false });
      // Validate the ROCrate
      const validCrate = new Validator(crate);
      if (!(await validCrate.validate())) {
        // If the ROCrate is invalid, do not process it
        console.error(`Skip invalid ROCrate: ${file.path}`);
        continue;
      }
      
      const crateRoot = crate.getEntity(crate.rootId);

      crateRoot.hasPart.forEach((element) => {
        try {
          const type = crate.getEntity(element['@id'])['@type'];
          const encodingFormat = crate.getEntity(element['@id'])['encodingFormat'];
          if (service.fdlUrl === "" && type.includes('File') && type.includes('SoftwareSourceCode') && encodingFormat === "text/yaml") {
            if (element['@id'].startsWith('http://') || element['@id'].startsWith('https://'))
              service.fdlUrl = element['@id'];
            else
              service.fdlUrl = folderRawFileUrl + element['@id'];
          }
          if (service.scriptUrl === "" && type.includes('File') && type.includes('SoftwareSourceCode') && encodingFormat === "text/x-shellscript") {
            if (element['@id'].startsWith('http://') || element['@id'].startsWith('https://'))
              service.scriptUrl = element['@id'];
            else
              service.scriptUrl = folderRawFileUrl + element['@id'];
          }
          if (type.includes('File') && type.includes('ImageObject')) {
            if (element['@id'].startsWith('http://') || element['@id'].startsWith('https://'))
              service.iconUrl = element['@id'];
            else
              service.iconUrl = folderRawFileUrl + element['@id'];
          }
        } catch (error) {
          console.error(`Skip invalid part in service definition file: ${file.path}`);
        }
      });

      if (service.fdlUrl === "" || service.scriptUrl === "" || service.iconUrl === "") {
        console.error(`Skip invalid service definition file: ${file.path}`);
        continue;
      }

      service.name = crateRoot.name;
      service.description = crateRoot.description;
      service.author = crate.getEntity(crateRoot.author['@id']).name;
      service.type = crateRoot.serviceType;

      const memory = crateRoot.memoryRequirements.split(' ');
      
      /^\d+$/.test(memory[0]) && (service.memoryRequirements = memory[0]);
      service.memoryUnits = memory[1] === "GiB" ? "Gi" : "Mi";

      crateRoot.processorRequirements.forEach((req) => {
        const splitReq = req.split(' ')
        const procType = /^(vCPU|GPU)$/i.test(splitReq[1]) ? splitReq[1] : "vCPU";
        procType === "vCPU" && (service.cpuRequirements = splitReq[0]);
        procType === "GPU" && (service.gpuRequirements = splitReq[0]);
      });

      serviceList.push(service);
    } catch (error) {
      console.error(`Error fetching file ${file.path}:`, error);
      continue;
    }
  }
  return serviceList;
}
