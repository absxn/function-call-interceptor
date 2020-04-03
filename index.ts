async function demoFunction<B extends {}, R extends {}>(params: {
  url: string;
  method: "POST" | "GET";
  body?: B;
}): Promise<R> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(({ call: `${params.method} ${params.url}` } as unknown) as R);
    }, 100);
  });
}

function wrap<T extends (...args: any) => Promise<any>>(fn: T) {
  return (...args: any[]): Promise<ReturnType<T>> => {
    return new Promise((resolve) => {
      setTimeout(() => fn(...args).then(resolve), 100);
    });
  };
}

function toString(obj: any) {
  return JSON.stringify(obj, null, 2);
}

async function benchmark<T>(fn: () => Promise<T>) {
  console.log("Enter");
  const startMs = Date.now();

  const returnValue = await fn();

  const endMs = Date.now();
  console.log(`Exit ${endMs - startMs}ms, returned ${toString(returnValue)}`);
}

async function main() {
  await benchmark(() => {
    return demoFunction({ method: "POST", url: "127.0.0.1" });
  });

  await benchmark(() => {
    const wrapped = wrap(demoFunction);

    return wrapped({ url: "localhost", method: "GET" });
  });
}

main();

export {};
