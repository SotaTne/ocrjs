import { program } from 'commander';
import { previewE2eMarkdown } from './commands/previewE2eMd.js';

program
  .name('docs')
  .command('prev-e2e:md')
  .description(
    '指定した e2e/typedoc fixture project 配下の *.md だけを mdts で公開する',
  )
  .argument('<project-name>')
  .option('--host <host>', 'host to listen on', 'localhost')
  .option('--no-open', 'do not open the browser automatically')
  .option('--port <port>', 'port to serve on', '8521')
  .option('--silent', 'suppress server logs')
  .action(async (projectName, options) => {
    process.exitCode = await previewE2eMarkdown(projectName, {
      host: options.host,
      noOpen: Boolean(options.noOpen),
      port: options.port,
      silent: Boolean(options.silent),
    });
  });

await program.parseAsync(process.argv);
