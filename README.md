## How to run 
> Install Deno from [Deno's official website](https://deno.land/)
> run `deno task serve` for server
> run `deno task start` to start client

## custom host
>Configure the SHOULD_CUSTOM_HOST setting in the .env file to customize your server host. The default value is false, which means the server will run locally on port 8080.

## [Deno compile](https://docs.deno.com/runtime/manual/tools/compiler/) for standalone executables
>deno compile ./client/index.ts

>deno compile ./server/index.ts