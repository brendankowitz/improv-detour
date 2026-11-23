export function MilePost({ miles }: { readonly miles: number }) {
  return (
    <span className="miles" aria-label={`${miles} ${miles === 1 ? 'mile' : 'miles'} together`}>
      <span className="mile-post" aria-hidden="true">
        {miles}
      </span>
      {miles === 1 ? 'mile' : 'miles'}
    </span>
  );
}
