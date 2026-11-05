// Візуальна позначка тимчасового тексту на інформаційних сторінках —
// щоб під час демонстрації було явно видно, що контент ще не фінальний.
export function PlaceholderNotice() {
  return (
    <div className="mb-6 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      Це тимчасовий текст-заглушка для демонстрації. Буде замінений реальним контентом клієнтки.
    </div>
  );
}
