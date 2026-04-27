/**
 * UserAvatar — shows the user's actual profile photo if available,
 * falling back to coloured initials when there is no avatar.
 *
 * Props:
 *   name        string  – displayed as initials fallback
 *   avatarUrl   string  – full URL to the profile photo (avatar_url from backend)
 *   size        'sm'|'md'|'lg'  – default 'md'
 *   rounded     'full'|'xl'     – default 'full'
 */
const SIZES = {
  sm: { wrapper: 'w-7 h-7',   text: 'text-xs' },
  md: { wrapper: 'w-9 h-9',   text: 'text-sm' },
  lg: { wrapper: 'w-11 h-11', text: 'text-base' },
};

export default function UserAvatar({ name, avatarUrl, size = 'md', rounded = 'full' }) {
  const { wrapper, text } = SIZES[size] || SIZES.md;
  const initials = (name || '?')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const shape = rounded === 'xl' ? 'rounded-xl' : 'rounded-full';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${wrapper} ${shape} object-cover shrink-0 border border-white/10`}
        onError={e => {
          // If image fails to load, replace with initials div
          e.target.replaceWith(
            Object.assign(document.createElement('div'), {
              className: `${wrapper} ${shape} bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shrink-0 ${text}`,
              textContent: initials,
            })
          );
        }}
      />
    );
  }

  return (
    <div
      className={`${wrapper} ${shape} bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shrink-0 ${text}`}
      title={name}
    >
      {initials}
    </div>
  );
}
