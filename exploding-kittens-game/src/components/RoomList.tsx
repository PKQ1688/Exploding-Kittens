import React, { useState, useEffect } from 'react';
import { socketService } from '../services/socket';
import './RoomList.css';

interface Room {
  id: string;
  name: string;
  players: any[];
  maxPlayers: number;
  isGameStarted: boolean;
  createdAt: string;
}

interface RoomListProps {
  onRoomJoined: () => void;
}

const RoomList: React.FC<RoomListProps> = ({ onRoomJoined }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 监听房间列表更新
    socketService.on('room_list', (roomList: Room[]) => {
      setRooms(roomList);
      setIsLoading(false);
    });

    // 监听房间加入成功
    socketService.on('room_joined', () => {
      onRoomJoined();
    });

    // 监听错误
    socketService.on('error', (message: string) => {
      setError(message);
      setIsLoading(false);
    });

    // 获取房间列表
    socketService.getRooms();
    setIsLoading(true);

    return () => {
      socketService.off('room_list', setRooms);
      socketService.off('room_joined', onRoomJoined);
      socketService.off('error', setError);
    };
  }, [onRoomJoined]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !playerName.trim()) {
      setError('请填写房间名和玩家名');
      return;
    }

    setIsLoading(true);
    setError(null);
    socketService.createRoom(roomName.trim(), playerName.trim());
  };

  const handleJoinRoom = (roomId: string) => {
    if (!playerName.trim()) {
      setError('请输入玩家名');
      return;
    }

    setIsLoading(true);
    setError(null);
    socketService.joinRoom(roomId, playerName.trim());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className="room-list">
      <div className="room-list__header">
        <h1>Exploding Kittens - 多人对战</h1>
        <div className="player-name-input">
          <input
            type="text"
            placeholder="输入你的玩家名"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="player-name-field"
          />
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="room-list__actions">
        <button
          className="create-room-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={isLoading}
        >
          {showCreateForm ? '取消创建' : '创建房间'}
        </button>
        
        <button
          className="refresh-btn"
          onClick={() => {
            setIsLoading(true);
            socketService.getRooms();
          }}
          disabled={isLoading}
        >
          刷新列表
        </button>
      </div>

      {showCreateForm && (
        <form className="create-room-form" onSubmit={handleCreateRoom}>
          <input
            type="text"
            placeholder="房间名称"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="room-name-input"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !roomName.trim() || !playerName.trim()}>
            {isLoading ? '创建中...' : '创建房间'}
          </button>
        </form>
      )}

      <div className="room-list__content">
        {isLoading && rooms.length === 0 ? (
          <div className="loading">加载中...</div>
        ) : rooms.length === 0 ? (
          <div className="no-rooms">
            <p>暂无可用房间</p>
            <p>创建一个新房间开始游戏吧！</p>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <div key={room.id} className="room-card">
                <div className="room-card__header">
                  <h3 className="room-name">{room.name}</h3>
                  <div className="room-time">创建于 {formatDate(room.createdAt)}</div>
                </div>
                
                <div className="room-card__info">
                  <div className="player-count">
                    👥 {room.players.length}/{room.maxPlayers} 玩家
                  </div>
                  
                  <div className="players-list">
                    {room.players.map((player, index) => (
                      <span key={index} className="player-tag">
                        {player.name}
                        {player.isReady && <span className="ready-indicator">✓</span>}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="room-card__actions">
                  <button
                    className="join-btn"
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={
                      isLoading || 
                      !playerName.trim() || 
                      room.players.length >= room.maxPlayers ||
                      room.players.some(p => p.name === playerName.trim())
                    }
                  >
                    {room.players.length >= room.maxPlayers ? '房间已满' : 
                     room.players.some(p => p.name === playerName.trim()) ? '名字重复' : '加入房间'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomList;
