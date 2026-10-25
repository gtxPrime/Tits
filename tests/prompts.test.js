const test = require('node:test');
const assert = require('node:assert');
const { getSystemPrompt, profilePrompts } = require('../src/utils/prompts');

test('prompts: profilePrompts contains all required profiles', () => {
    assert.ok(profilePrompts.interview);
    assert.ok(profilePrompts.exam);
    assert.ok(profilePrompts.sales);
    assert.ok(profilePrompts.meeting);
    assert.ok(profilePrompts.presentation);
    assert.ok(profilePrompts.negotiation);
});

test('prompts: getSystemPrompt builds valid prompt for exam mode', () => {
    const prompt = getSystemPrompt('exam', 'Candidate notes on calculus', false);
    assert.ok(prompt.includes('exam assistant') || prompt.includes('tests efficiently'));
    assert.ok(prompt.includes('Candidate notes on calculus'));
    assert.ok(!prompt.includes('SEARCH TOOL USAGE:'), 'Should omit search usage when search is disabled');
});

test('prompts: getSystemPrompt includes search usage section when search enabled', () => {
    const prompt = getSystemPrompt('interview', '', true);
    assert.ok(prompt.includes('SEARCH TOOL USAGE:'));
    assert.ok(prompt.includes('Google search'));
});

test('prompts: defaults to interview profile when unknown profile passed', () => {
    const prompt = getSystemPrompt('nonexistent_profile', '', false);
    assert.ok(prompt.includes('interview assistant'));
});
