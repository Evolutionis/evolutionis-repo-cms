import { useState, useMemo } from 'react';
import {
  Rocket, Star, Heart, Zap, Award, Target, TrendingUp, Briefcase,
  Users, User, Mail, Phone, MapPin, Globe, Calendar, Clock,
  Camera, Image, Video, Music, Headphones, Mic, Settings, Wrench,
  ShoppingCart, ShoppingBag, CreditCard, DollarSign, Gift, Tag,
  MessageCircle, MessageSquare, Send, Share2, ThumbsUp, Bell,
  Shield, Lock, Key, CheckCircle, Check, Flag, Bookmark,
  Home, Building, Store, Truck, Package, Box, Layers, Grid3x3,
  Smartphone, Laptop, Monitor, Wifi, Cloud, Database, Code, Terminal,
  PenTool, Edit, FileText, Folder, Search, Filter, Sliders,
  Sun, Moon, Coffee, Compass, Map, Navigation, Anchor, Feather,
  Instagram, Facebook, Twitter, Linkedin, Youtube, Github, X,
} from 'lucide-react';

// Mapa nome -> componente. O nome (string) é o que fica salvo no content.json.
const ICON_MAP = {
  Rocket, Star, Heart, Zap, Award, Target, TrendingUp, Briefcase,
  Users, User, Mail, Phone, MapPin, Globe, Calendar, Clock,
  Camera, Image, Video, Music, Headphones, Mic, Settings, Wrench,
  ShoppingCart, ShoppingBag, CreditCard, DollarSign, Gift, Tag,
  MessageCircle, MessageSquare, Send, Share2, ThumbsUp, Bell,
  Shield, Lock, Key, CheckCircle, Check, Flag, Bookmark,
  Home, Building, Store, Truck, Package, Box, Layers, Grid3x3,
  Smartphone, Laptop, Monitor, Wifi, Cloud, Database, Code, Terminal,
  PenTool, Edit, FileText, Folder, Search, Filter, Sliders,
  Sun, Moon, Coffee, Compass, Map, Navigation, Anchor, Feather,
  Instagram, Facebook, Twitter, Linkedin, Youtube, Github,
};
const ICON_NAMES = Object.keys(ICON_MAP);

export function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return ICON_NAMES;
    return ICON_NAMES.filter((n) => n.toLowerCase().includes(term));
  }, [q]);

  const Current = value && ICON_MAP[value] ? ICON_MAP[value] : null;

  return (
    <div>
      <div className="icon-field">
        <div className="icon-current">
          {Current ? <Current size={26} /> : <span style={{ fontSize: 11, color: 'var(--muted)' }}>—</span>}
        </div>
        <div style={{ flex: 1 }}>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(true)}>
            {value ? `Ícone: ${value}` : 'Escolher ícone'}
          </button>
          {value && (
            <button
              type="button"
              className="link"
              style={{ marginLeft: 10 }}
              onClick={() => onChange('')}
            >
              remover
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
            <h3>Escolher ícone</h3>
            <input
              placeholder="Buscar ícone…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
            <div className="icon-grid">
              {filtered.map((name) => {
                const Ico = ICON_MAP[name];
                if (!Ico) return null;
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    className={`icon-btn ${value === name ? 'selected' : ''}`}
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                    }}
                  >
                    <Ico size={20} />
                  </button>
                );
              })}
            </div>
            {filtered.length === 0 && <p className="empty">Nenhum ícone encontrado.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
