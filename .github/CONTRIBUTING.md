# Contributing Guidelines

Thank you for your interest in this project.

We greatly value feedback from the community.

## Reporting

Please use [GitHub Discussions][gh-discussions] for all triage, ideas, and
general project discussion.

GitHub Issues are **reserved** for maintainer-tracked work items. Discussions
that turn into confirmed issues or accepted ideas will have a linked issue
created by a maintainer.

Before opening a discussion, check open and recently closed discussions to make
sure the same thing hasn't already been reported or proposed.

## Pull Requests

Pull requests are limited to repository collaborators.

If you are not a collaborator, please use [GitHub Discussions][gh-discussions]
to report issues and propose ideas with the maintainer(s). If a change is
accepted, a maintainer may invite collaboration or open the implementation
directly.

**Before** sending us a pull request, please ensure that:

1. You check existing open, and recently merged, pull requests to make sure
   someone else hasn't already addressed the problem.
2. You [open a discussion][gh-discussions] to discuss any significant work with
   the maintainer(s).
3. For changes that need tracked follow-up, you reference the relevant
   discussion and any maintainer-created issue for context.
4. You have collaborator access to the repository.
5. You are working against the latest source on the `main` branch.

To open a pull request, please:

1. Create a topic branch from the latest `main` branch.
2. Modify the source; please focus on the **specific** change you are
   contributing.
3. Ensure local tests pass.
4. Update the documentation, if required.
5. Sign-off and commit your changes
   [using a clear commit messages][better-git-commits]. Use of
   [Conventional Commits][conventional-commits] are required.
6. Open a pull request, answering any default questions.
7. Pay attention to any automated failures reported in the pull request, and
   stay involved in the conversation.

GitHub provides additional documentation on
[creating a pull request][gh-pull-requests].

### Contributor Flow

This is an outline of the contributor workflow:

- Create a topic branch from where you want to base your work.
- Make commits of logical units.
- Make sure your commit messages are
  [in the proper format][conventional-commits] **and** are signed-off.
- Push your changes to your collaborator branch.
- Submit a pull request. If the pull request is a work in progress, open as
  draft until ready for review.

> [!IMPORTANT]
> This project **requires** that commits are signed-off for the [Developer Certificate of Origin][dco].
> Please refer to [Signing Your Git Commits: From Zero to Verified][sign-git-commits] for more information.

Example:

```shell
git remote add upstream https://github.com/tenthirtyam/setup-task.git
git checkout --branch feat/add-x main
git commit --signoff --message "feat: add support for x
  Added support for x.

  Signed-off-by: Jane Doe <jdoe@example.com>

  Ref: #123"
git push origin feat/add-x
```

### Formatting Commit Messages

We follow the conventions on [How to Write a Better Git Commit Message][better-git-commits] and
[Conventional Commits][conventional-commits].

Be sure to include any related GitHub issue references in the commit message.

Example:

```markdown
feat: add support for x

Added support for x.

Signed-off-by: Jane Doe <jdoe@example.com>

Ref: #123
```

### Staying In Sync With Upstream

When your branch gets out of sync with the `tenthirtyam/main` branch, use the
following to update:

```shell
git checkout feat/add-x
git fetch --all
git pull --rebase upstream main
git push --force-with-lease origin feat/add-x
```

### Updating Pull Requests

If your pull request fails to pass or needs changes based on code review, you'll
most likely want to squash these changes into existing commits.

If your pull request contains a single commit or your changes are related to the
most recent commit, you can simply amend the commit.

```shell
git add .
git commit --amend
git push --force-with-lease origin feat/add-x
```

If you need to squash changes into an earlier commit, you can use:

```shell
git add .
git commit --fixup <commit>
git rebase --interactive --autosquash main
git push --force-with-lease origin feat/add-x
```

Be sure to add a comment to the pull request indicating your new changes are
ready to review, as GitHub does not generate a notification when you `git push`.

## Finding Contributions to Work On

Looking at the existing discussions and maintainer-created issues is a great
way to find something to contribute on. If you have an idea you'd like to
discuss, [open a discussion][gh-discussions].

[dco]: https://probot.github.io/apps/dco/
[conventional-commits]: https://conventionalcommits.org
[gh-discussions]: https://github.com/tenthirtyam/setup-task/discussions
[gh-discussions-triage]: https://github.com/tenthirtyam/setup-task/discussions/new?category=triage
[gh-discussions-ideas]: https://github.com/tenthirtyam/setup-task/discussions/new?category=ideas
[gh-issues]: https://github.com/tenthirtyam/setup-task/issues
[gh-markdown]: https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github
[gh-pull-requests]: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request
[better-git-commits]: https://tenthirtyam.org/dispatches/2026/03/22/conventional-commits-how-to-write-a-better-git-commit-message/?h=better+git
[sign-git-commits]: https://tenthirtyam.org/dispatches/2026/03/23/signing-your-git-commits-from-zero-to-verified/?h=sign
