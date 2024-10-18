import axios from "axios";

type GetInfoProps = {
  endpoint: string;
  username: string;
  password: string;
  token: string;
};

export async function getInfoApi({
  endpoint,
  username,
  password,
  token,
}: GetInfoProps) {
  let config
  if (token!=""){
    config = {
      baseURL: endpoint,
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }
  }else{
    config = {
      baseURL: endpoint,
      auth: {
        username,
        password,
      },
    }
  }
  const response = await axios.get("/system/info", config);

  return response.data;
}
