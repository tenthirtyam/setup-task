# Task Setup Action

A GitHub Action for efficiently setting up the Task ([`go-task/task`][task-gh]) task runner in GitHub Actions.

## What is Task?

[Task][task] is a task runner / build tool that aims to be simpler and easier to use than, for example, GNU Make.

It's written in Go and can be used as a simpler alternative to complex build tools or custom scripts.

## Usage

This action provides several options for customization:

| Input               | Description                                                                                                                                                                                                                                                                               |
| ------------------- |-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`           | Specify the Task version to install. (e.g., `latest` (default), `3.0.0`, `v3.0.0`). This input conflicts with `version-from-file`. If not specified, the latest version will be installed.                                                               |
| `version-from-file` | Specify a file containing the Task version to install. (e.g., `./.task-version`). This input conflicts with `version`. This file should contain a single line with the version number. The version can be a specific version (e.g., `3.0.0`) or a tag (e.g., `v3.0.0`). |
| `skip-cache`        | Skip using the cache. Default is `false`. Set to `true` to skip using the cache. Set to `false` to use the cache (default).                                                                                                                                                   |
| `github-token`      | Provide a GitHub token for authenticating API requests. This token is used to authenticate API requests to GitHub. Recommended to use `secrets.GITHUB_TOKEN`.                                                                                                                 |
| `vars`              | Custom variables for the Task CLI in a YAML map format. This is useful for setting passing configuration options to Task. Each variable should be specified as a key-value pair. Example: `vars: [FOO=bar, BAZ=qux]`.                                                   |
| `verbose`           | Enable detailed logging for debugging purposes. Default is `false`. Set to `true` to enable verbose logging. Set to `false` to disable verbose logging (default).                                                                                                             |

### Basic Usage

```yaml
- name: Setup Task
  uses: tenthirtyam/setup-task@v1
  with:
    version: 'latest' # Or a specific version (e.g., '3.0.0', 'v3.0.0').
```

> [!NOTE]
> It's recommended to pin to a commit hash (_e.g._, `@6413e46...`) in production workflows for stability.
>
> ```yaml
> - name: Setup Task
>   uses: tenthirtyam/setup-task@{commit-hash} # v1.0.0
> ```

### Advanced Usage

```yaml
- name: Setup Task
  uses: tenthirtyam/setup-task@v1
  with:
    # Task version to install (default: latest).
    # NOTE: This input conflicts with 'version-from-file'.
    version: 'latest' # Or a specific version (e.g., '3.0.0', 'v3.0.0').

    # Path to a file containing the Task version to install.
    # NOTE: This input conflicts with 'version'.
    # version-from-file: './.task-version'

    # Skip cache usage (default: false).
    skip-cache: 'false'

    # Provide a GitHub token for authenticating API requests.
    github-token: ${{ secrets.GITHUB_TOKEN }}

    # Custom variables for the Task CLI.
    vars:
      - FOO=bar
      - BAZ=qux

    # Enable detailed logging for debugging purposes (default: false).
    verbose: 'true'
```

## Examples

Refer to the `examples/` folder for usage scenarios.

## Sponsor

[![Sponsor](https://img.shields.io/badge/Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)][sponsor]&nbsp;&nbsp;
[![Buy me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=white)][buy-me-a-coffee]

## License

Copyright &copy; 2025 Ryan Johnson

Licensed under the [MIT License][license].

This GitHub Action includes various components with distinct copyright notices and license terms. Your use of these components is governed by their respective licenses. For a detailed list of components and their licenses, refer to the [NOTICE][notice].

[task]: https://taskfile.dev
[task-gh]: https://github.com/go-task/task
[license]: LICENSE
[notice]: NOTICE.md
[sponsor]: https://github.com/sponsors/tenthirtyam
[buy-me-a-coffee]: https://buymeacoffee.com/tenthirtyam
