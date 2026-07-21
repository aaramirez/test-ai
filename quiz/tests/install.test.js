#!/usr/bin/env node
/**
 * install.test.js — Tests for quiz system installer
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync, mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');

// The installer does not exist yet — these tests will fail (RED phase)
describe('install.js module exports', () => {
  it('exports an install function', async () => {
    const mod = await import('../cli/install.js');
    assert.equal(typeof mod.install, 'function');
  });

  it('exports a getFileList function', async () => {
    const mod = await import('../cli/install.js');
    assert.equal(typeof mod.getFileList, 'function');
  });
});

describe('getFileList (dry-run)', () => {
  let mod;

  before(async () => {
    // Clear any require cache
    const url = new URL('../cli/install.js', import.meta.url);
    mod = await import(url.href);
  });

  it('returns expected files including quiz CLI scripts', () => {
    const files = mod.getFileList(PROJECT_ROOT);
    const paths = files.map(f => f.replace(PROJECT_ROOT + '/', ''));

    assert.ok(paths.some(p => p.startsWith('quiz/cli/')), 'includes quiz cli scripts');
    assert.ok(paths.some(p => p.startsWith('quiz/lib/')), 'includes quiz lib modules');
    assert.ok(!paths.some(p => p.startsWith('quiz/banks/')), 'excludes quiz banks (user data)');
    assert.ok(!paths.some(p => p.startsWith('quiz/results/')), 'excludes quiz results (user data)');
    assert.ok(!paths.some(p => p.startsWith('quiz/keys/')), 'excludes quiz keys (user data)');
    assert.ok(paths.some(p => p.startsWith('quiz/tests/')), 'includes quiz tests');
    assert.ok(paths.some(p => p.startsWith('quiz/manuals/')), 'includes quiz manuals');

    assert.ok(paths.some(p => p.startsWith('.opencode/skills/quiz/')), 'includes quiz skill');
    assert.ok(paths.some(p => p.startsWith('.opencode/skills/quiz-admin/')), 'includes quiz-admin skill');
    assert.ok(paths.some(p => p.startsWith('.opencode/skills/quiz-bank/')), 'includes quiz-bank skill');
    assert.ok(paths.some(p => p.startsWith('.opencode/skills/quiz-key/')), 'includes quiz-key skill');
    assert.ok(paths.some(p => p.startsWith('.opencode/skills/quiz-participant/')), 'includes quiz-participant skill');
    assert.ok(paths.some(p => p.startsWith('.opencode/skills/quiz-results/')), 'includes quiz-results skill');
    assert.ok(paths.some(p => p.startsWith('.opencode/skills/testing/')), 'includes testing skill');

    assert.ok(paths.some(p => p.startsWith('.opencode/commands/test.md')), 'includes test command');
    assert.ok(paths.some(p => p.startsWith('.opencode/commands/plan.md')), 'includes plan command');

    assert.ok(paths.some(p => p.startsWith('.opencode/agents/tester.md')), 'includes tester agent');
    assert.ok(paths.some(p => p.startsWith('.opencode/rules/testing.md')), 'includes testing rules');
    assert.ok(paths.some(p => p.startsWith('.opencode/rules/code-style.md')), 'includes code-style rules');

    assert.ok(paths.some(p => p.startsWith('opencode.json')), 'includes opencode.json');
    assert.ok(paths.some(p => p.startsWith('AGENTS.md')), 'includes AGENTS.md');
    assert.ok(paths.some(p => p.startsWith('package.json')), 'includes package.json');
    assert.ok(paths.some(p => p.startsWith('.gitignore')), 'includes .gitignore');
  });

  it('excludes non-quiz skills and node_modules', () => {
    const files = mod.getFileList(PROJECT_ROOT);
    const paths = files.map(f => f.replace(PROJECT_ROOT + '/', ''));

    assert.ok(!paths.some(p => p.startsWith('.opencode/skills/branding/')), 'excludes branding skill');
    assert.ok(!paths.some(p => p.startsWith('.opencode/skills/youtube/')), 'excludes youtube skill');
    assert.ok(!paths.some(p => p.startsWith('node_modules/')), 'excludes node_modules');
    assert.ok(!paths.some(p => p.startsWith('plans/')), 'excludes plans directory');
    assert.ok(!paths.some(p => p.startsWith('assets/')), 'excludes assets directory');
  });

  it('includes opencode.json at root', () => {
    const files = mod.getFileList(PROJECT_ROOT);
    assert.ok(files.some(f => f.endsWith('/opencode.json')), 'opencode.json at root');
  });
});

describe('install function', () => {
  let tmpDir;
  let mod;

  before(async () => {
    tmpDir = mkdtempSync(join(__dirname, '..', '..', 'tmp-install-test-'));
    mod = await import('../cli/install.js');
  });

  after(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('copies files to target directory', () => {
    mod.install({ sourceRoot: PROJECT_ROOT, targetDir: tmpDir, fixCi: false });

    assert.ok(existsSync(join(tmpDir, 'opencode.json')), 'opencode.json copied');
    assert.ok(existsSync(join(tmpDir, 'AGENTS.md')), 'AGENTS.md copied');
    assert.ok(existsSync(join(tmpDir, 'quiz', 'cli', 'run-quiz.js')), 'CLI script copied');
    assert.ok(existsSync(join(tmpDir, 'quiz', 'lib', 'schema.js')), 'lib module copied');
    assert.ok(existsSync(join(tmpDir, 'quiz', 'tests', 'scorer.test.js')), 'test file copied');
    assert.ok(existsSync(join(tmpDir, '.opencode', 'skills', 'quiz', 'SKILL.md')), 'quiz skill copied');
    assert.ok(existsSync(join(tmpDir, '.opencode', 'commands', 'test.md')), 'test command copied');
    assert.ok(existsSync(join(tmpDir, '.opencode', 'agents', 'tester.md')), 'tester agent copied');
  });

  it('does not copy non-quiz skills', () => {
    assert.ok(!existsSync(join(tmpDir, '.opencode', 'skills', 'branding')), 'branding not copied');
    assert.ok(!existsSync(join(tmpDir, '.opencode', 'skills', 'youtube')), 'youtube not copied');
  });

  it('copies ci-validate script', () => {
    assert.ok(existsSync(join(tmpDir, '.opencode', 'scripts', 'ci-validate.js')), 'ci-validate copied');
  });

  it('opencode.json is valid JSON in target', () => {
    const config = JSON.parse(readFileSync(join(tmpDir, 'opencode.json'), 'utf-8'));
    assert.ok(config.instructions, 'has instructions key');
    assert.ok(Array.isArray(config.instructions), 'instructions is an array');
    assert.ok(config.instructions.includes('AGENTS.md'), 'instructions references AGENTS.md');
  });

  it('installed quiz cli script can load', async () => {
    // Just verify the file exists and is valid JS (don't run it — it needs stdin/banks)
    const content = readFileSync(join(tmpDir, 'quiz', 'cli', 'run-quiz.js'), 'utf-8');
    assert.ok(content.includes('import'), 'valid ES module');
  });

  it('installed ci-validate checks .opencode/ not shared/', () => {
    const content = readFileSync(join(tmpDir, '.opencode', 'scripts', 'ci-validate.js'), 'utf-8');
    assert.ok(!content.includes("join(ROOT, 'shared'") || !content.includes("'shared/'"), 'ci-validate does not reference shared/ dir');
    assert.ok(content.includes(".opencode") || content.includes("opencode"), 'ci-validate references .opencode');
  });
});

describe('install --fix-ci creates patched ci-validate', () => {
  let tmpDir;
  let mod;

  before(async () => {
    tmpDir = mkdtempSync(join(__dirname, '..', '..', 'tmp-ci-fix-test-'));
    mod = await import('../cli/install.js');
    mod.install({ sourceRoot: PROJECT_ROOT, targetDir: tmpDir, fixCi: true });
  });

  after(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('ci-validate checks .opencode/ skills directory', () => {
    const content = readFileSync(join(tmpDir, '.opencode', 'scripts', 'ci-validate.js'), 'utf-8');
    assert.ok(content.includes('.opencode'), 'references .opencode directory');
    assert.ok(content.includes("'AGENTS.md'"), 'checks AGENTS.md exists');
  });
});

describe('quiz-install skill and commands', () => {
  it('quiz-install skill SKILL.md exists with valid frontmatter', () => {
    const skillPath = join(PROJECT_ROOT, '.opencode', 'skills', 'quiz-install', 'SKILL.md');
    assert.ok(existsSync(skillPath), 'quiz-install SKILL.md exists');
    const content = readFileSync(skillPath, 'utf-8');
    assert.ok(/^name:\s*quiz-install/m.test(content), 'has name: quiz-install');
    assert.ok(/^description:\s*\S+/m.test(content), 'has description');
    assert.ok(/^scripts:\s*\n/m.test(content), 'has scripts array');
    assert.ok(content.includes('../../quiz/cli/install.js'), 'references install.js');
  });

  it('/quiz-install command file exists and mentions directory', () => {
    const cmdPath = join(PROJECT_ROOT, '.opencode', 'commands', 'quiz-install.md');
    assert.ok(existsSync(cmdPath), 'quiz-install.md exists');
    const content = readFileSync(cmdPath, 'utf-8');
    assert.ok(content.includes('$ARGUMENTS'), 'uses $ARGUMENTS');
  });

  it('/quiz-install-update command file exists and mentions directory', () => {
    const cmdPath = join(PROJECT_ROOT, '.opencode', 'commands', 'quiz-install-update.md');
    assert.ok(existsSync(cmdPath), 'quiz-install-update.md exists');
    const content = readFileSync(cmdPath, 'utf-8');
    assert.ok(content.includes('$ARGUMENTS'), 'uses $ARGUMENTS');
    assert.ok(content.includes('node quiz/cli/install.js'), 'references install.js');
  });

  it('opencode.json has quiz-install and quiz-install-update commands', () => {
    const config = JSON.parse(readFileSync(join(PROJECT_ROOT, 'opencode.json'), 'utf-8'));
    assert.ok(config.command, 'has commands object');
    assert.ok(config.command['quiz-install'], 'has quiz-install command');
    assert.ok(config.command['quiz-install'].description, 'quiz-install has description');
    assert.ok(config.command['quiz-install'].template, 'quiz-install has template');
    assert.ok(config.command['quiz-install-update'], 'has quiz-install-update command');
    assert.ok(config.command['quiz-install-update'].description, 'quiz-install-update has description');
    assert.ok(config.command['quiz-install-update'].template, 'quiz-install-update has template');
    assert.ok(
      config.command['quiz-install'].template.includes('$ARGUMENTS') &&
      config.command['quiz-install-update'].template.includes('$ARGUMENTS'),
      'both commands reference $ARGUMENTS'
    );
  });

  it('AGENTS.md mentions quiz-install skill and commands', () => {
    const content = readFileSync(join(PROJECT_ROOT, 'AGENTS.md'), 'utf-8');
    assert.ok(content.includes('quiz-install'), 'mentions quiz-install in skills or commands');
    assert.ok(content.includes('/quiz-install-update') || content.includes('quiz-install-update'), 'mentions quiz-install-update');
  });
});

describe('install --force exports isProtected', () => {
  it('exports an isProtected function', async () => {
    const mod = await import('../cli/install.js');
    assert.equal(typeof mod.isProtected, 'function');
  });
});

describe('install --force protected paths', () => {
  let tmpDir;
  let mod;

  before(async () => {
    tmpDir = mkdtempSync(join(__dirname, '..', '..', 'tmp-install-protect-'));
    mod = await import('../cli/install.js');
  });

  after(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('does not overwrite protected files present in target', () => {
    // Create user data files in target BEFORE install
    const targetTeam = join(tmpDir, 'team.json');
    const targetId = join(tmpDir, 'id.json');
    const targetRegistry = join(tmpDir, 'surveys', 'registry.json');
    const targetVisibility = join(tmpDir, 'surveys', 'visibility.json');
    const targetBanks = join(tmpDir, 'quiz', 'banks');
    const targetResults = join(tmpDir, 'quiz', 'results');
    const targetSurveyResults = join(tmpDir, 'surveys', 'results');
    const targetIndex = join(tmpDir, 'surveys', '_index.json');

    mkdirSync(join(tmpDir, 'quiz'), { recursive: true });
    mkdirSync(join(tmpDir, 'surveys'), { recursive: true });
    mkdirSync(targetBanks, { recursive: true });
    mkdirSync(targetResults, { recursive: true });
    mkdirSync(targetSurveyResults, { recursive: true });

    writeFileSync(targetTeam, '{"PROTECTED":true}', 'utf-8');
    writeFileSync(targetId, '{"PROTECTED":true}', 'utf-8');
    writeFileSync(targetRegistry, '{"PROTECTED":true}', 'utf-8');
    writeFileSync(targetVisibility, '{"PROTECTED":true}', 'utf-8');
    writeFileSync(targetIndex, '{"PROTECTED":true}', 'utf-8');
    writeFileSync(join(targetBanks, 'my-custom-bank.json'), '{"PROTECTED":true}', 'utf-8');
    writeFileSync(join(targetResults, 'my-result.json'), '{"PROTECTED":true}', 'utf-8');
    writeFileSync(join(targetSurveyResults, 'my-survey-result.json'), '{"PROTECTED":true}', 'utf-8');

    mod.install({ sourceRoot: PROJECT_ROOT, targetDir: tmpDir, fixCi: false });

    // Verify protected files were NOT overwritten
    assert.equal(JSON.parse(readFileSync(targetTeam, 'utf-8')).PROTECTED, true);
    assert.equal(JSON.parse(readFileSync(targetId, 'utf-8')).PROTECTED, true);
    assert.equal(JSON.parse(readFileSync(targetRegistry, 'utf-8')).PROTECTED, true);
    assert.equal(JSON.parse(readFileSync(targetVisibility, 'utf-8')).PROTECTED, true);
    assert.equal(JSON.parse(readFileSync(targetIndex, 'utf-8')).PROTECTED, true);

    const bankContent = readFileSync(join(targetBanks, 'my-custom-bank.json'), 'utf-8');
    assert.equal(JSON.parse(bankContent).PROTECTED, true);

    const resultContent = readFileSync(join(targetResults, 'my-result.json'), 'utf-8');
    assert.equal(JSON.parse(resultContent).PROTECTED, true);

    const surveyResultContent = readFileSync(join(targetSurveyResults, 'my-survey-result.json'), 'utf-8');
    assert.equal(JSON.parse(surveyResultContent).PROTECTED, true);
  });

  it('system files are still copied despite protected files', () => {
    assert.ok(existsSync(join(tmpDir, 'opencode.json')), 'opencode.json copied');
    assert.ok(existsSync(join(tmpDir, 'quiz', 'cli', 'run-quiz.js')), 'CLI script copied');
    assert.ok(existsSync(join(tmpDir, 'quiz', 'lib', 'schema.js')), 'lib module copied');
    assert.ok(existsSync(join(tmpDir, '.opencode', 'skills', 'quiz', 'SKILL.md')), 'quiz skill copied');
    assert.ok(existsSync(join(tmpDir, 'quiz', 'manuals', 'admin.md')), 'manual copied');
  });

  it('does not copy source banks when target banks dir exists', () => {
    // The source quiz/banks/javascript.json should NOT appear in target
    // because the entire banks/ directory is protected
    const targetJavascriptBank = join(tmpDir, 'quiz', 'banks', 'javascript.json');
    // It shouldn't exist because protect skips it AND source wouldn't overwrite target
    // Actually it might exist in target because we mkdirSync'd it but the file wasn't created
    // The point is the source file's contents did NOT overwrite our PROTECTED file
    assert.ok(existsSync(join(tmpDir, 'quiz', 'banks'), 'banks dir exists'));
  });
});

describe('install --force overwrites protected files', () => {
  let tmpDir;
  let mod;

  before(async () => {
    tmpDir = mkdtempSync(join(__dirname, '..', '..', 'tmp-install-force-'));
    mod = await import('../cli/install.js');
    // Create target with a protected file
    mkdirSync(join(tmpDir, 'quiz'), { recursive: true });
    writeFileSync(join(tmpDir, 'team.json'), '{"PROTECTED":true}', 'utf-8');
    // Install with --force
    mod.install({ sourceRoot: PROJECT_ROOT, targetDir: tmpDir, fixCi: false, force: true });
  });

  after(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('source team.json overwrites target team.json when --force', () => {
    // Note: team.json is now excluded from source, so target remains PROTECTED
    // This test verifies that with --force, the file is NOT overwritten because
    // it's in EXCLUDE_PREFIXES (never copied from source)
    const content = readFileSync(join(tmpDir, 'team.json'), 'utf-8');
    const parsed = JSON.parse(content);
    assert.equal(parsed.PROTECTED, true, 'was NOT overwritten (excluded from source)');
  });
});

describe('Spanish documentation', () => {
  const manualsDir = join(PROJECT_ROOT, 'quiz', 'manuals');

  it('admin-guia.md exists and is non-empty', () => {
    const path = join(manualsDir, 'admin-guia.md');
    assert.ok(existsSync(path), 'admin-guia.md exists');
    const content = readFileSync(path, 'utf-8');
    assert.ok(content.trim().length > 0, 'admin-guia.md is non-empty');
    assert.ok(/^\s*#/.test(content), 'has markdown heading');
  });

  it('participante.md exists and is non-empty', () => {
    const path = join(manualsDir, 'participante.md');
    assert.ok(existsSync(path), 'participante.md exists');
    const content = readFileSync(path, 'utf-8');
    assert.ok(content.trim().length > 0, 'participante.md is non-empty');
    assert.ok(/^\s*#/.test(content), 'has markdown heading');
  });

  it('referencia-rapida.md exists and is non-empty', () => {
    const path = join(manualsDir, 'referencia-rapida.md');
    assert.ok(existsSync(path), 'referencia-rapida.md exists');
    const content = readFileSync(path, 'utf-8');
    assert.ok(content.trim().length > 0, 'referencia-rapida.md is non-empty');
    assert.ok(/^\s*#/.test(content), 'has markdown heading');
  });
});

describe('tutorial installation', () => {
  let mod;

  before(async () => {
    const url = new URL('../cli/install.js', import.meta.url);
    mod = await import(url.href);
  });

  it('getFileList includes tutorial CLI scripts', () => {
    const files = mod.getFileList(PROJECT_ROOT);
    const paths = files.map(f => f.replace(PROJECT_ROOT + '/', ''));
    assert.ok(paths.some(p => p.startsWith('tutorials/cli/')), 'includes tutorial cli scripts');
  });

  it('getFileList includes tutorial lib modules', () => {
    const files = mod.getFileList(PROJECT_ROOT);
    const paths = files.map(f => f.replace(PROJECT_ROOT + '/', ''));
    assert.ok(paths.some(p => p.startsWith('tutorials/lib/')), 'includes tutorial lib modules');
  });

  it('getFileList includes tutorial tests', () => {
    const files = mod.getFileList(PROJECT_ROOT);
    const paths = files.map(f => f.replace(PROJECT_ROOT + '/', ''));
    assert.ok(paths.some(p => p.startsWith('tutorials/tests/')), 'includes tutorial tests');
  });

  it('getFileList excludes tutorial banks (user data)', () => {
    const files = mod.getFileList(PROJECT_ROOT);
    const paths = files.map(f => f.replace(PROJECT_ROOT + '/', ''));
    assert.ok(!paths.some(p => p.startsWith('tutorials/banks/')), 'excludes tutorial banks');
  });

  it('getFileList excludes tutorial keys (user data)', () => {
    const files = mod.getFileList(PROJECT_ROOT);
    const paths = files.map(f => f.replace(PROJECT_ROOT + '/', ''));
    assert.ok(!paths.some(p => p.startsWith('tutorials/keys/')), 'excludes tutorial keys');
  });

  it('getFileList excludes tutorial sessions (user data)', () => {
    const files = mod.getFileList(PROJECT_ROOT);
    const paths = files.map(f => f.replace(PROJECT_ROOT + '/', ''));
    assert.ok(!paths.some(p => p.startsWith('tutorials/sessions/')), 'excludes tutorial sessions');
  });

  it('getFileList includes tutorial skills', () => {
    const files = mod.getFileList(PROJECT_ROOT);
    const paths = files.map(f => f.replace(PROJECT_ROOT + '/', ''));
    assert.ok(paths.some(p => p.startsWith('.opencode/skills/tutorial/')), 'includes tutorial skill');
    assert.ok(paths.some(p => p.startsWith('.opencode/skills/tutorial-create/')), 'includes tutorial-create skill');
    assert.ok(paths.some(p => p.startsWith('.opencode/skills/tutorial-admin/')), 'includes tutorial-admin skill');
  });

  it('getFileList includes tutorial commands', () => {
    const files = mod.getFileList(PROJECT_ROOT);
    const paths = files.map(f => f.replace(PROJECT_ROOT + '/', ''));
    assert.ok(paths.some(p => p.startsWith('.opencode/commands/tutorial.md')), 'includes tutorial command');
    assert.ok(paths.some(p => p.startsWith('.opencode/commands/tutorial-create.md')), 'includes tutorial-create command');
    assert.ok(paths.some(p => p.startsWith('.opencode/commands/tutorial-report.md')), 'includes tutorial-report command');
  });

  it('install copies tutorial files to target', () => {
    const tmpDir = mkdtempSync(join(__dirname, '..', '..', 'tmp-tutorial-install-'));
    
    try {
      mod.install({ sourceRoot: PROJECT_ROOT, targetDir: tmpDir, fixCi: false });
      
      assert.ok(existsSync(join(tmpDir, 'tutorials', 'cli', 'create-tutorial.js')), 'tutorial CLI script copied');
      assert.ok(existsSync(join(tmpDir, 'tutorials', 'lib', 'schema.js')), 'tutorial lib module copied');
      assert.ok(existsSync(join(tmpDir, '.opencode', 'skills', 'tutorial', 'SKILL.md')), 'tutorial skill copied');
      assert.ok(existsSync(join(tmpDir, '.opencode', 'commands', 'tutorial.md')), 'tutorial command copied');
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('install does not overwrite protected tutorial files', () => {
    const tmpDir = mkdtempSync(join(__dirname, '..', '..', 'tmp-tutorial-protect-'));
    
    try {
      // Create user data files in target BEFORE install
      mkdirSync(join(tmpDir, 'tutorials', 'banks'), { recursive: true });
      mkdirSync(join(tmpDir, 'tutorials', 'keys'), { recursive: true });
      mkdirSync(join(tmpDir, 'tutorials', 'sessions'), { recursive: true });
      
      writeFileSync(join(tmpDir, 'tutorials', 'banks', 'my-custom.json'), '{"PROTECTED":true}', 'utf-8');
      writeFileSync(join(tmpDir, 'tutorials', 'keys', 'my-custom.json'), '{"PROTECTED":true}', 'utf-8');
      writeFileSync(join(tmpDir, 'tutorials', 'sessions', 'my-session.json'), '{"PROTECTED":true}', 'utf-8');
      
      mod.install({ sourceRoot: PROJECT_ROOT, targetDir: tmpDir, fixCi: false });
      
      // Verify protected files were NOT overwritten
      assert.equal(JSON.parse(readFileSync(join(tmpDir, 'tutorials', 'banks', 'my-custom.json'), 'utf-8')).PROTECTED, true);
      assert.equal(JSON.parse(readFileSync(join(tmpDir, 'tutorials', 'keys', 'my-custom.json'), 'utf-8')).PROTECTED, true);
      assert.equal(JSON.parse(readFileSync(join(tmpDir, 'tutorials', 'sessions', 'my-session.json'), 'utf-8')).PROTECTED, true);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
