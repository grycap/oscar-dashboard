import { DockerImage } from "@/lib/utils";

export const DOCKER_IMAGE_URL = "https://ghcr.io/grycap/juno";
export const IMAGE_TAGS: DockerImage[] = [
  {
    tag: "minimal", 
    description: "OSCAR JUNO with a minimal Jupyter Notebook and the JupyterLab Git extension",
    url: `${DOCKER_IMAGE_URL}:minimal`
  },
  {
    tag: "full", 
    description: "Extends the OSCAR JUNO Minimal image with Elyra and APRICOTLab; also includes the IM-Client, OSCAR Python client, OIDC-Agent and NodeJS",
    url: `${DOCKER_IMAGE_URL}:full`
  }
];