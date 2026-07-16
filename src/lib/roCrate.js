import { ROCrate, Validator } from 'ro-crate';

function isSupportedIcon(id, type) {
  return (
    /^icon\.(png|svg)$/i.test(id) &&
    type.includes('File') &&
    type.includes('ImageObject')
  );
}

function resolveGithubBlobUrl(baseBlobUrl, relativePath) {
  const url = new URL(baseBlobUrl);
  const segments = url.pathname.split('/').filter(Boolean);
  const relativeSegments = relativePath.split('/');
  let resolvedSegments;

  if (url.hostname === 'raw.githubusercontent.com') {
    resolvedSegments = [...segments];
    if (!baseBlobUrl.endsWith('/') && resolvedSegments.length > 3 && resolvedSegments[resolvedSegments.length - 1].includes('.')) {
      resolvedSegments.pop();
    }
  } else if (url.hostname === 'github.com' && segments[2] === 'blob') {
    resolvedSegments = segments.slice(0, segments.length - 1);
  } else {
    throw new Error('Invalid GitHub URL');
  }

  for (const part of relativeSegments) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      if (resolvedSegments.length <= 3) {
        throw new Error('Relative path escapes repository root');
      }
      resolvedSegments.pop();
    } else {
      resolvedSegments.push(part);
    }
  }

  url.pathname = '/' + resolvedSegments.join('/');
  return url.toString();
}

function parseMemoryRequirements(requirements, service) {
  const memoryRequirements = Array.isArray(requirements) ? requirements : [requirements];

  for (const req of memoryRequirements) {
    const { value, unit } = normalizeMemoryRequirement(req, [
      { match: /kserve-?GiB/i, unit: 'Gi' },
      { match: /GiB/i, unit: 'Gi' },
      { match: /MiB/i, unit: 'Mi' }
    ], 'Mi');

    if (!value) continue;

    if (/kserve-?GiB/i.test(String(req))) {
      service.kserveMemoryRequirements = value;
      service.kserveMemoryUnits = unit;
    } else {
      service.memoryRequirements = value;
      service.memoryUnits = unit;
    }
  }
}

function parseProcessorRequirements(requirements, service) {
  const processorRequirements = Array.isArray(requirements) ? requirements : [requirements];

  for (const req of processorRequirements) {
    const splitReq = String(req).trim().split(/\s+/);
    if (splitReq.length < 2) continue;

    const [value, procType] = splitReq;

    if (/^vCPU$/i.test(procType)) {
      service.cpuRequirements = value;
    } else if (/^GPU$/i.test(procType)) {
      service.gpuRequirements = value;
    } else if (/^kserve-vCPU$/i.test(procType)) {
      service.kserveCpuRequirements = value;
    } else if (/^kserve-GPU$/i.test(procType)) {
      service.kserveGpuRequirements = value;
    }
  }
}

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
    agentSoulUrl: "",
    agentSkillUrl: [],
    agentType: "", // "exposed" | "on-demand",

    kserveMemoryRequirements: "2",
    kserveMemoryUnits: "Mi",
    kserveCpuRequirements: "1",
    kserveGpuRequirements: "0",
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
async function parseROCrateDataJScore(githubUser, githubRepo, githubBranch, cratesFolder = 'crates', validate = false, isAgentService = false) {
  // Define the GitHub repository details
  // Replace with your GitHub username, repository name, and branch
  const user = githubUser;
  const repo = githubRepo;
  const branch = githubBranch;
  const githubUrl = `https://api.github.com/repos/${user}/${repo}/git/trees/${branch}`;

  const fetchFromGitHubOptions = {
    method: 'GET',
    headers: {
      'Accept': 'text/plain, application/x-yaml, */*',
      // Can be required for private repositories or higher rate limits
      //'Authorization': `Bearer ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
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
            else if (element['@id'].startsWith('../'))
                service.fdlUrl = resolveGithubBlobUrl(`${folderRawFileUrl}/`, element['@id']);
            else
              service.fdlUrl = `${folderRawFileUrl}/fdl.yml`;
            
          }
          if (service.scriptUrl === "" && element['@id'].includes("script.sh") && type.includes('File') && type.includes('SoftwareSourceCode') && encodingFormat === "text/x-shellscript") {
            //service.scriptUrl = crate.getEntity(element['@id'])['url'];
            if (element['@id'].startsWith('http://') || element['@id'].startsWith('https://')) {
              service.scriptUrl = element['@id'];
            }
            else if (element['@id'].startsWith('../')) {
              service.scriptUrl = resolveGithubBlobUrl(`${folderRawFileUrl}/`, element['@id']);
            }
            else {
              service.scriptUrl = `${folderRawFileUrl}/script.sh`;
            }
          }
          if (isSupportedIcon(element['@id'], type)) {
            if (
              element['@id'].startsWith('http://') ||
              element['@id'].startsWith('https://')
            )
              service.iconUrl = element['@id'];
            else
              service.iconUrl = `${folderRawFileUrl}/${element['@id']}`;
          }
          if (isAgentService) {
            if (service.agentSoulUrl === "" && element['@id'].includes("SOUL.md") && type.includes('File') && type.includes('AgentSoul')){
              if (element['@id'].startsWith('http://') || element['@id'].startsWith('https://'))
                service.agentSoulUrl = element['@id'];
              else if (element['@id'].startsWith('../'))
                service.agentSoulUrl = resolveGithubBlobUrl(`${folderRawFileUrl}/`, element['@id']);
              else
                service.agentSoulUrl = `${folderRawFileUrl}/SOUL.md`;
            }
            if (element['@id'].includes("SKILL.md") && type.includes('File') && type.includes('AgentSkill')){
              if (element['@id'].startsWith('http://') || element['@id'].startsWith('https://'))
                service.agentSkillUrl = service.agentSkillUrl.concat([element['@id']]);
              else if (element['@id'].startsWith('../'))
                service.agentSkillUrl = service.agentSkillUrl.concat([resolveGithubBlobUrl(`${folderRawFileUrl}/`, element['@id'])]);
              else
                service.agentSkillUrl = service.agentSkillUrl.concat([`${folderRawFileUrl}/SKILL.md`]);
            }
            
          }
        } catch (error) {
          console.error(`Skip invalid part in service definition file: ${file.path}`);
        }
      });

      if (isAgentService) {
        service.agentType = crateRoot.agentType;
      }

      if ((service.fdlUrl === "" || service.scriptUrl === "" || service.iconUrl === "") ||
         (isAgentService && service.agentType === "")) {
        console.error(`Skip invalid service definition file: ${file.path}`);
        continue;
      }

      service.name = crateRoot.name;
      service.description = crateRoot.description;
      service.author = crate.getEntity(crateRoot.author['@id']).name;
      service.type = Array.isArray(crateRoot.serviceType) ? crateRoot.serviceType : [crateRoot.serviceType];

      parseMemoryRequirements(crateRoot.memoryRequirements, service);
      parseProcessorRequirements(crateRoot.processorRequirements, service);

      serviceList.push(service);
    } catch (error) {
      console.error(`Error fetching file ${file.path}:`, error);
      continue;
    }
  }
  return serviceList;
}


function normalizeMemoryRequirement(requirement, unitMap = [{ match: /GiB/i, unit: 'Gi' }, { match: /MiB/i, unit: 'Mi' }], defaultUnit = 'Mi') {
  const normalized = Array.isArray(requirement)
    ? requirement.map((item) => String(item).trim()).join(' ').trim()
    : String(requirement ?? '').trim();

  const parts = normalized.split(/\s+/).filter(Boolean);
  const value = parts.length > 0 && /^\d+$/.test(parts[0]) ? parts[0] : '';
  const text = parts.slice(1).join(' ');
  const match = unitMap.find((entry) => entry.match.test(text));

  return {
    value,
    unit: match ? match.unit : defaultUnit,
  };
}

export async function parseAgentsROCrateDataJS(githubUser, githubRepo, githubBranch, cratesFolder = "agents", validate = false) {
  return parseROCrateDataJScore(githubUser, githubRepo, githubBranch, cratesFolder, validate, true);
}

export async function parseROCrateDataJS(githubUser, githubRepo, githubBranch, cratesFolder = "crates", validate = false) {
  return parseROCrateDataJScore(githubUser, githubRepo, githubBranch, cratesFolder, validate, false);
}
