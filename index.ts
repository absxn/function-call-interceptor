function toString(obj: any) {
  return JSON.stringify(obj, null, 2);
}

async function demoFunction<B extends {}, R extends {}>(params: {
  url: string;
  method: "POST" | "GET";
  body?: B;
}): Promise<R> {
  const returnValue = { call: `${params.method} ${params.url}` };
  console.log(`function(${toString(arguments)}) => ${toString(returnValue)}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve((returnValue as unknown) as R);
    }, 100);
  });
}

interface InterceptReturn {
  op: "intercept-return";
}

interface InterceptCall {
  op: "intercept-call";
}

interface DelayCall {
  op: "delay-call";
}

interface DelayReturn {
  op: "delay-return";
}

type Interceptor = InterceptCall | InterceptReturn | DelayCall | DelayReturn;

function wrap<T extends (...args: any) => Promise<any>>(
  interceptor: Interceptor,
  fn: T
) {
  return (...args: any[]): Promise<ReturnType<T>> => {
    switch (interceptor.op) {
      case "delay-call":
        return new Promise((resolve) => {
          setTimeout(() => fn(...args).then(resolve), 100);
        });
      case "delay-return":
        return new Promise((resolve) => {
          fn(...args).then((returnValue) =>
            setTimeout(() => resolve(returnValue), 100)
          );
        });
      case "intercept-call":
        return new Promise((resolve) => {
          setTimeout(() => fn(...args, { intercept: true }).then(resolve), 100);
        });
      case "intercept-return":
        return new Promise((resolve) => {
          fn(...args).then((returnValue) =>
            resolve({ ...returnValue, intercept: true })
          );
        });
        break;
    }
    return new Promise((resolve) => {
      setTimeout(() => fn(...args).then(resolve), 100);
    });
  };
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
    const wrapped = wrap({ op: "intercept-call" }, demoFunction);

    return wrapped({ url: "localhost", method: "GET" });
  });
}

main();

export {};
