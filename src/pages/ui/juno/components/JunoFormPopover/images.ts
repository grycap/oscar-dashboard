import { DockerImage } from "@/lib/utils";

export const DOCKER_IMAGE_URL = "https://ghcr.io/grycap/juno";
export const IMAGE_TAGS: DockerImage[] = [
  {
    tag: "minimal", 
    description: "OSCAR JUNO with minimal Jupyter Notebook and JupyterLab Git extension",
    url: `${DOCKER_IMAGE_URL}:minimal`
  },
  {
    tag: "full", 
    description: "Extends OSCAR JUNO Minimal image with Elyra and ApricotLab, also includes the IM-Client, OSCAR Python client, OIDC-Agent and NodeJS",
    url: `${DOCKER_IMAGE_URL}:full`
  }
];