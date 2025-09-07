'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

type RolePreview = 'admin' | 'teacher' | 'parent' | 'sub';

export default function RoleViewToggle({
  current,
}: {
  current: RolePreview;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(() => new URLSearchParams(searchParams?.toString()), [searchParams]);

  const setRole = (role: RolePreview) => {
    if (role === current) return;
    params.set('view', role);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const Button = ({
    role,
    label,
  }: {
    role: RolePreview;
    label: string;
  }) => {
    const active = current === role;
    return (
      <button
        type="button"
        onClick={() => setRole(role)}
        className={[
          'px-3 py-1.5 rounded-xl text-sm border transition',
          active
            ? 'bg-blue-600 text-white border-blue-600 shadow'
            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300',
        ].join(' ')}
        aria-pressed={active}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline text-xs text-gray-500">Preview as:</span>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        <Button role="admin"   label="Admin" />
        <Button role="teacher" label="Teacher" />
        <Button role="parent"  label="Parent" />
        <Button role="sub"     label="Substitute" />
      </div>
    </div>
  );
}
