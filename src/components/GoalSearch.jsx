import { ArrowRight, ArrowUpRight, Search, Sparkles } from 'lucide-react';
import { getSuggestions } from '../lib/recommendations.js';

export default function GoalSearch({ products, query, onQuery, onSelectGoal, onSelectProduct, activeGoal, compact = false }) {
  const suggestions = query.trim() ? getSuggestions(query, products) : [];
  const visible = compact ? suggestions.slice(0, 4) : suggestions;

  return (
    <div className={`goal-search ${compact ? 'goal-search--compact' : ''}`}>
      <div className="search-input-row">
        <span className="search-orbit"><Sparkles size={17} /></span>
        <input
          aria-label="Describe what you want to achieve"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && suggestions[0]) {
              if (suggestions[0].type === 'goal') onSelectGoal(suggestions[0].goal);
              else onSelectProduct(suggestions[0].product);
            }
            if (event.key === 'Escape') onQuery('');
          }}
          placeholder={compact ? 'Search a goal or product…' : 'I want to… build a routine, refresh my style, find a gift'}
        />
        <button className="search-submit" aria-label="Show suggestions" onClick={() => suggestions[0] && (suggestions[0].type === 'goal' ? onSelectGoal(suggestions[0].goal) : onSelectProduct(suggestions[0].product))}><ArrowRight size={19} /></button>
      </div>
      {visible.length > 0 && (
        <div className="suggestion-panel">
          <p className="suggestion-heading">{activeGoal ? 'Explore another direction' : 'A few paths to get you there'}</p>
          {visible.map((item) => (
            <button key={`${item.type}-${item.type === 'goal' ? item.goal.id : item.product.id}`} className="suggestion-item" onClick={() => item.type === 'goal' ? onSelectGoal(item.goal) : onSelectProduct(item.product)}>
              <span className={`suggestion-symbol ${item.type === 'product' ? 'suggestion-symbol--product' : ''}`}>
                {item.type === 'goal' ? <Sparkles size={15} /> : <img src={item.product.image} alt="" />}
              </span>
              <span><strong>{item.value}</strong><small>{item.type === 'goal' ? 'Goal path' : 'Product in the catalog'}</small></span>
              <ArrowUpRight size={15} className="suggestion-arrow" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
