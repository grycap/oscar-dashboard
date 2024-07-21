import axios from "axios";

type GetInfoProps = {
  endpoint: string;
  username: string;
  password: string;
};

export async function getInfoApi({
  endpoint,
  username,
  password,
}: GetInfoProps) {
  const response = await axios.get("/system/info", {
    baseURL: endpoint,
    auth: {
      username,
      password,
    },
  });

  return response.data;
}
