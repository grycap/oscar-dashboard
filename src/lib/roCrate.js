import { cache } from 'react';
import { ROCrate, Validator } from 'ro-crate';

const RoCrateServiceDefinition = {
    name: "",
    description: "",
    fdlUrl: "",
    scriptUrl: "",
    author: "",
    type: ["", ""],
    iconUrl: "https://oscar.grycap.net/images/oscar3-logo-trans.png",
    memoryRequirements: "2",
    memoryUnits: "Mi",
    cpuRequirements: "1",
    gpuRequirements: "0",
};

/* With validation
18 requests
4.3 kB transferred
700 kB resources
*/
/* Without validation
10 requests
1.1 kB transferred
21.9 kB resources
*/
export default async function parseROCrateDataJS(githubUser, githubRepo, githubBranch, validate = false) {
  // Define the GitHub repository details
  // Replace with your GitHub username, repository name, and branch
  const user = githubUser;
  const repo = githubRepo;
  const branch = githubBranch;
  const cratesFolder = 'crates';
  const githubUrl = `https://api.github.com/repos/${user}/${repo}/git/trees/${branch}`;

  const fetchFromGitHubOptions = {
    method: 'GET',
    headers: {
      'Accept': 'text/plain, application/x-yaml, */*',
      // Can be required for private repositories or higher rate limits
      //'Authorization': `token ${""}`
    }
  };
  
  // Fetch the list of files in the GitHub repository
  const data = await fetch(githubUrl, fetchFromGitHubOptions).then(async (response) => {
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded 60 req/hour. Please try again later.');
      }
      throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const url = data.tree.find((folder) => folder.path === cratesFolder).url;
    const res = await fetch(`${url}?recursive=1`, fetchFromGitHubOptions);
    console.log(res);
    return await res.json();
  }).catch((error) => {
    console.error(error);
    return;
  });
  // If data fetching failed, return an empty array
  if (!data) { return []; }

  // Filter for ro-crate-metadata.json files (folder/fileName)
  var files = data.tree.filter((item) => item.type === 'blob' && item.path.includes('ro-crate-metadata.json'));

  var serviceList = [];
  // Process each ro-crate-metadata.json file
  for (const file of files) {
    var service = { ...RoCrateServiceDefinition };
    const baseRawFileUrl = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${cratesFolder}/`;

    // Fetch the content of the file
    const fileUrl = baseRawFileUrl + file.path;
    const folderRawFileUrl = fileUrl.replace('/ro-crate-metadata.json', '');
    
    try {
      const response = await (await fetch(fileUrl, {method: 'GET'})).json();
      // Create a new ROCrate instance
      const crate = new ROCrate(response, { array: false, link: false });
      // Validate the ROCrate clientside, if required
      if (validate) {
        const validCrate = new Validator(crate);
        if (!(await validCrate.validate())) {
          // If the ROCrate is invalid, do not process it
          console.error(`Skip invalid ROCrate: ${file.path}`);
          continue;
        }
      }
      
      const crateRoot = crate.getEntity(crate.rootId);
      // Process the crateRoot to extract service definition details
      crateRoot.hasPart.forEach((element) => {
        try {
          const type = crate.getEntity(element['@id'])['@type'];
          const encodingFormat = crate.getEntity(element['@id'])['encodingFormat'];
          if (service.fdlUrl === "" && element['@id'].includes("fdl.yml") && type.includes('File') && type.includes('SoftwareSourceCode') && encodingFormat === "text/yaml") {
            //service.fdlUrl = crate.getEntity(element['@id'])['url'];
            if (element['@id'].startsWith('http://') || element['@id'].startsWith('https://'))
              service.fdlUrl = element['@id'];
            else
              service.fdlUrl = `${folderRawFileUrl}/fdl.yml`;
            
          }
          if (service.scriptUrl === "" && element['@id'].includes("script.sh") && type.includes('File') && type.includes('SoftwareSourceCode') && encodingFormat === "text/x-shellscript") {
            //service.scriptUrl = crate.getEntity(element['@id'])['url'];
            if (element['@id'].startsWith('http://') || element['@id'].startsWith('https://'))
              service.scriptUrl = element['@id'];
            else
              service.scriptUrl = `${folderRawFileUrl}/script.sh`;
          }
          if (element['@id'].includes("icon.png") && type.includes('File') && type.includes('ImageObject')) {
            if (element['@id'].startsWith('http://') || element['@id'].startsWith('https://'))
              service.iconUrl = element['@id'];
            else
              service.iconUrl = `${folderRawFileUrl}/icon.png`;
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
      service.type = Array.isArray(crateRoot.serviceType) ? crateRoot.serviceType : [crateRoot.serviceType];

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