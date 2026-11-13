import { app } from "./app";
import { env } from "./config/env";

const server = app.listen(env.port, () => {
  console.log(`API disponível em http://localhost:${env.port}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Não foi possível iniciar a API: a porta ${env.port} já está em uso. Encerre o processo que a utiliza ou defina outra API_PORT no .env.`
    );
  } else {
    console.error('Não foi possível iniciar a API.', error);
  }

  process.exitCode = 1;
});
