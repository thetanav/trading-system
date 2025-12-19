type ApiOptions = RequestInit & {
  cookieHeader?: string;
};

export async function api<T>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const { cookieHeader, ...fetchOptions } = options;
  
  let headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  // If cookieHeader is provided (server-side), add it to headers
  if (cookieHeader) {
    headers = {
      ...headers,
      Cookie: cookieHeader,
    };
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    ...fetchOptions,
    credentials: "include",
    headers,
  });

  const data = await res.json();
  console.log(data);
  return data as T;
}
