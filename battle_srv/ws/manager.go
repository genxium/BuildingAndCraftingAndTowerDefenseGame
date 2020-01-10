package ws

import (
	. "server/common"
	"sync"

	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

type Manager struct {
	disposed    bool
	sessionMap  sync.Map
	disposeOnce sync.Once
	disposeWait sync.WaitGroup
}

func NewManager() *Manager {
	manager := &Manager{}
	return manager
}

func (manager *Manager) Dispose() {
	manager.disposeOnce.Do(func() {
		manager.disposed = true
		manager.sessionMap.Range(func(key, value interface{}) bool {
			value.(*Session).Close()
			return true
		})
		manager.disposeWait.Wait()
	})
}

func (manager *Manager) NewSession(id int32, conn *websocket.Conn, sendChanSize int) *Session {
	session := newSession(manager, id, conn, sendChanSize)
	manager.putSession(session)
	return session
}

func (manager *Manager) GetSession(sessionID int32) *Session {
	value, ok := manager.sessionMap.Load(sessionID)
	if ok {
		return value.(*Session)
	}
	return nil
}

func (manager *Manager) putSession(session *Session) {
	if manager.disposed {
		session.Close()
		return
	}
	manager.sessionMap.Store(session.id, session)
	manager.disposeWait.Add(1)
}

func (manager *Manager) delSession(session *Session) {
	manager.sessionMap.Delete(session.id)
	manager.disposeWait.Done()
}

func (manager *Manager) Debug() {
	manager.sessionMap.Range(func(key, value interface{}) bool {
		Logger.Debug("session", zap.Any("key", key))
		return true
	})
}
