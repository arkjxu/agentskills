# README CI Badge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a GitHub Actions CI status badge to the project README so readers can see whether the `CI` workflow on `main` is passing.

**Architecture:** This change is documentation-only. Modify the top of `README.md` to include the standard GitHub Actions badge URL for `.github/workflows/ci.yml`, wrapped in a link to the workflow page.

**Tech Stack:** Markdown, GitHub Actions badge endpoint

---

### Task 1: Add the README badge

**Files:**
- Modify: `README.md`
- Create: `docs/plans/2026-03-13-readme-ci-badge.md`

**Step 1: Update the README heading block**

Insert a linked badge directly below the package title:

```md
[![CI](https://github.com/arkjxu/agentskills/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/arkjxu/agentskills/actions/workflows/ci.yml)
```

**Step 2: Verify the Markdown content**

Run: `sed -n '1,12p' README.md`
Expected: the title line is followed by the `CI` badge markdown and then the existing project description.
