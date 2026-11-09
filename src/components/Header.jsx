const links = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#signup', label: 'Join' },
];

export default function Header() {
  return (
    <header className="wrap">
      <nav>
        <a className="logo" href="#">
          Someday<span>Monday</span>
        </a>
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
