# Testing Style Isolation

## Manual Testing Checklist

Use this checklist to verify style isolation is working correctly in your host project.

### ✅ Pre-Integration Tests

Before integrating into your project, verify:

- [ ] Package builds successfully: `pnpm run build`
- [ ] No global `@tailwind base` in output CSS
- [ ] All CSS classes have `erix-` prefix
- [ ] CSS variables are scoped to `.erix-app`

### ✅ Integration Tests

After integrating into your project:

#### Test 1: No Global Style Pollution

```tsx
// Create a test page with your styles and Erix components
function TestPage() {
  return (
    <div>
      {/* Your app's styles */}
      <h1 className="text-3xl font-bold">My App Title</h1>
      <button className="btn btn-primary">My Button</button>
      
      {/* Erix components */}
      <ErixContainer>
        <ErixDashboard />
      </ErixContainer>
      
      {/* Your app's styles again */}
      <p className="text-gray-600">This should look normal</p>
    </div>
  );
}
```

**Expected**: 
- Your app's styles remain unchanged
- Erix components have their own styling
- No visual conflicts

**If Failed**: 
- Check that styles are imported correctly
- Verify `ErixContainer` is used
- Clear build cache and rebuild

#### Test 2: Multiple Instances

```tsx
function TestPage() {
  return (
    <div>
      <ErixContainer>
        <ErixEditor />
      </ErixContainer>
      
      <div className="my-content">
        <p>Some content between</p>
      </div>
      
      <ErixContainer darkMode>
        <WhatsAppInbox />
      </ErixContainer>
    </div>
  );
}
```

**Expected**:
- Both Erix instances work independently
- Dark mode only affects second instance
- Content between is unaffected

#### Test 3: CSS Specificity

```tsx
function TestPage() {
  return (
    <div>
      {/* Your global button style */}
      <button className="btn">My Button</button>
      
      <ErixContainer>
        {/* Erix button should not be affected by your .btn class */}
        <button className="erix-btn">Erix Button</button>
      </ErixContainer>
    </div>
  );
}
```

**Expected**:
- Your button uses your styles
- Erix button uses Erix styles
- No cross-contamination

#### Test 4: CSS Variables

```tsx
// In your global CSS
:root {
  --primary: #ff0000;
  --background: #ffffff;
}

// In your component
function TestPage() {
  return (
    <div style={{ background: 'var(--background)' }}>
      <p style={{ color: 'var(--primary)' }}>My Text</p>
      
      <ErixContainer>
        {/* Should use --erix-primary, not --primary */}
        <ErixDashboard />
      </ErixContainer>
    </div>
  );
}
```

**Expected**:
- Your variables work in your code
- Erix uses its own `--erix-*` variables
- No variable conflicts

#### Test 5: Tailwind Utilities

```tsx
function TestPage() {
  return (
    <div className="flex gap-4 p-4"> {/* Your Tailwind */}
      <div className="bg-blue-500 p-4">Your Content</div>
      
      <ErixContainer>
        {/* Uses erix-flex, erix-gap-4, etc. */}
        <ErixDashboard />
      </ErixContainer>
    </div>
  );
}
```

**Expected**:
- Your Tailwind classes work normally
- Erix uses prefixed classes internally
- No utility conflicts

#### Test 6: Dark Mode

```tsx
function TestPage() {
  return (
    <div className="dark"> {/* Your dark mode */}
      <p className="text-white">Your dark mode content</p>
      
      {/* Erix light mode */}
      <ErixContainer>
        <ErixDashboard />
      </ErixContainer>
      
      {/* Erix dark mode */}
      <ErixContainer darkMode>
        <WhatsAppInbox />
      </ErixContainer>
    </div>
  );
}
```

**Expected**:
- Your dark mode works independently
- Erix light mode instance is light
- Erix dark mode instance is dark
- No interference

#### Test 7: Radix UI Portals

```tsx
function TestPage() {
  return (
    <div>
      {/* Your dialog */}
      <YourDialog>
        <button>Your Dialog Button</button>
      </YourDialog>
      
      <ErixContainer>
        {/* Erix dialog (uses Radix UI internally) */}
        <ErixDashboard /> {/* Has dialogs/popovers */}
      </ErixContainer>
    </div>
  );
}
```

**Expected**:
- Both dialogs work correctly
- Erix dialogs are styled correctly
- Your dialogs are unaffected
- No z-index conflicts

### ✅ Visual Regression Tests

Take screenshots before and after integration:

1. **Homepage**: Should look identical
2. **Forms**: Input styles unchanged
3. **Buttons**: Button styles unchanged
4. **Typography**: Text styles unchanged
5. **Layout**: Grid/flex layouts unchanged

### ✅ Browser Testing

Test in multiple browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### ✅ Performance Tests

Check bundle size impact:

```bash
# Before integration
npm run build
# Note the bundle size

# After integration
npm install @ecodrix/erix-react
npm run build
# Compare bundle size

# Expected increase: ~57KB gzipped
```

## Automated Testing

### Unit Test Example

```tsx
import { render } from '@testing-library/react';
import { ErixContainer, ErixDashboard } from '@ecodrix/erix-react';

describe('Style Isolation', () => {
  it('applies erix-app class', () => {
    const { container } = render(
      <ErixContainer>
        <ErixDashboard />
      </ErixContainer>
    );
    
    expect(container.firstChild).toHaveClass('erix-app');
  });
  
  it('applies dark mode class', () => {
    const { container } = render(
      <ErixContainer darkMode>
        <ErixDashboard />
      </ErixContainer>
    );
    
    expect(container.firstChild).toHaveClass('erix-app', 'dark');
  });
  
  it('preserves custom classes', () => {
    const { container } = render(
      <ErixContainer className="my-custom-class">
        <ErixDashboard />
      </ErixContainer>
    );
    
    expect(container.firstChild).toHaveClass('erix-app', 'my-custom-class');
  });
});
```

### CSS Specificity Test

```tsx
import { render } from '@testing-library/react';
import { ErixContainer } from '@ecodrix/erix-react';

describe('CSS Specificity', () => {
  it('does not affect global styles', () => {
    const { container } = render(
      <div>
        <button className="btn" data-testid="global-btn">
          Global Button
        </button>
        <ErixContainer>
          <button className="erix-btn" data-testid="erix-btn">
            Erix Button
          </button>
        </ErixContainer>
      </div>
    );
    
    const globalBtn = container.querySelector('[data-testid="global-btn"]');
    const erixBtn = container.querySelector('[data-testid="erix-btn"]');
    
    // Get computed styles
    const globalStyles = window.getComputedStyle(globalBtn);
    const erixStyles = window.getComputedStyle(erixBtn);
    
    // They should have different styles
    expect(globalStyles.backgroundColor).not.toBe(erixStyles.backgroundColor);
  });
});
```

## Common Issues and Solutions

### Issue: Build fails with CSS errors

**Cause**: PostCSS configuration missing  
**Solution**: Ensure `postcss.config.js` exists with required plugins

```js
export default {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    'postcss-nested': {},
  },
};
```

### Issue: Styles not applying in production

**Cause**: CSS not included in build  
**Solution**: Check `sideEffects` in package.json

```json
{
  "sideEffects": ["**/*.css"]
}
```

### Issue: Dark mode not working

**Cause**: Dark mode class not applied  
**Solution**: Use `darkMode` prop on `ErixContainer`

```tsx
<ErixContainer darkMode>
  <YourComponent />
</ErixContainer>
```

### Issue: Radix UI portals not styled

**Cause**: Portal elements outside `.erix-app`  
**Solution**: Already handled automatically, but verify Radix UI version compatibility

## Reporting Issues

If you find style isolation issues:

1. **Verify Setup**: Follow this testing guide completely
2. **Create Minimal Reproduction**: Isolate the issue
3. **Collect Information**:
   - Your framework and version
   - Your CSS framework and version
   - Browser and version
   - Screenshots showing the issue
4. **Open Issue**: https://github.com/ecodrix/erix-react/issues

Include:
```
**Environment**
- Framework: Next.js 16.1.7
- CSS Framework: Tailwind CSS 4.0
- Browser: Chrome 120
- @ecodrix/erix-react version: 0.2.3

**Issue**
[Describe the style conflict]

**Reproduction**
[Link to CodeSandbox or minimal repo]

**Expected**
[What should happen]

**Actual**
[What actually happens]

**Screenshots**
[If applicable]
```

## Success Criteria

Your integration is successful when:

- ✅ All tests pass
- ✅ No visual regressions in your app
- ✅ Erix components render correctly
- ✅ No console errors or warnings
- ✅ Performance is acceptable
- ✅ Works in all target browsers
- ✅ Dark mode works as expected
- ✅ Multiple instances work independently

## Next Steps

After successful testing:

1. Deploy to staging environment
2. Run full QA testing
3. Monitor for any issues
4. Deploy to production
5. Monitor production metrics

## Support

Need help with testing?

- 📖 [Documentation](https://docs.ecodrix.com)
- 💬 [Discord](https://discord.gg/ecodrix)
- 📧 [Email](mailto:support@ecodrix.com)
