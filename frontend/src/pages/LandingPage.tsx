import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Clock, Layers, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ItalyFlag, UKFlag } from '../components/FlatFlags';

interface Session {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  node_count: number;
}

export const LandingPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const loadSessions = async () => {
    try {
      console.log('Loading sessions...');
      const response = await fetch('http://127.0.0.1:8765/api/sessions');
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Sessions data:', data);
      setSessions(data.sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateNew = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8765/api/sessions', {
        method: 'POST',
      });
      const session = await response.json();
      navigate(`/workflow/${session.id}`);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('landing.deleteConfirm'))) return;

    try {
      await fetch(`http://127.0.0.1:8765/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      loadSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('app.title')}</h1>
            <p className="text-sm text-gray-500">{t('app.subtitle')}</p>
          </div>
          
          {/* Wiki Link + Language Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/wiki')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all font-medium"
            >
              <BookOpen className="w-4 h-4" />
              Wiki
            </button>
            
            <div className="w-px h-6 bg-gray-300" />
            
            <button
              onClick={() => changeLanguage('it')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 ${
                i18n.language === 'it' ? 'bg-blue-500/10 ring-2 ring-blue-400/30' : 'hover:bg-gray-100/80'
              }`}
              title="Italiano"
            >
              <ItalyFlag />
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 ${
                i18n.language === 'en' ? 'bg-blue-500/10 ring-2 ring-blue-400/30' : 'hover:bg-gray-100/80'
              }`}
              title="English"
            >
              <UKFlag />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Create New Button */}
        <div className="mb-8">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:shadow-lg transition-all hover:scale-105"
          >
            <Plus className="w-6 h-6" />
            <span className="font-semibold text-lg">{t('landing.newWorkflow')}</span>
          </button>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-500">{t('landing.loading')}</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('landing.noSessions')}</h3>
            <p className="text-gray-500">{t('landing.createFirst')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(`/workflow/${session.id}`)}
                className="group bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                      {session.name}
                    </h3>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title={t('landing.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Layers className="w-4 h-4" />
                    <span>{session.node_count} {t('landing.nodes')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(session.updated_at)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {t('landing.created')}: {formatDate(session.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
