import React, { useEffect, useState, useCallback } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import sortBy from 'lodash/sortBy';
import NavigationLink from 'plaid-threads/NavigationLink';

import { RouteInfo, ItemType, AccountType } from './types';
import { useItems, useAccounts, useUsers, useLink } from '../services';
import { setIdentityCheckById } from '../services/api';

import { Banner, UserCard, ErrorMessage, ItemCard } from '.';

// provides view of user's net worth, spending by category and allows them to explore
// account and transactions details for linked items

const UserPage = ({ match }: RouteComponentProps<RouteInfo>) => {
  const [user, setUser] = useState({
    id: 0,
    username: '',
    email: '',
    identity_check: false,
    created_at: '',
    updated_at: '',
  });
  const [items, setItems] = useState<ItemType[]>([]);
  const [numOfItems, setNumOfItems] = useState(0);
  const [accounts, setAccounts] = useState<AccountType[]>([]);
  const [identityCheck, setIdentityCheck] = useState(false);

  const { getAccountsByUser, accountsByUser } = useAccounts();
  const { usersById, getUserById } = useUsers();
  const { itemsByUser, getItemsByUser } = useItems();
  const userId = Number(match.params.userId);

  const checkUserName = useCallback(
    (names: string[]) => {
      const usernameArray = user.username.split(' ');
      // if both the first name and last name of the username in this app are included somewhere in the
      // financial institution's names array, return true
      return usernameArray.every(username => {
        return names.some(identName => {
          return identName.indexOf(username) > -1;
        });
      });
    },
    [user.username]
  );

  const checkUserEmail = useCallback(
    (emails: string[]) => {
      const userEmail = user.email;
      return emails.includes(userEmail);
    },
    [user.email]
  );

  // update data store with user
  useEffect(() => {
    getUserById(userId, false);
  }, [getUserById, userId]);

  // set state user from data store
  useEffect(() => {
    setUser(usersById[userId] || {});
  }, [usersById, userId]);

  // update data store with the user's items
  useEffect(() => {
    if (userId != null) {
      getItemsByUser(userId, true);
    }
  }, [getItemsByUser, userId]);

  // update state items from data store
  useEffect(() => {
    const newItems: Array<ItemType> = itemsByUser[userId] || [];
    const orderedItems = sortBy(
      newItems,
      item => new Date(item.updated_at)
    ).reverse();
    setItems(orderedItems);
  }, [itemsByUser, userId]);

  // update no of items from data store
  useEffect(() => {
    if (itemsByUser[userId] != null) {
      setNumOfItems(itemsByUser[userId].length);
    } else {
      setNumOfItems(0);
    }
  }, [itemsByUser, userId]);

  // update data store with the user's accounts
  useEffect(() => {
    getAccountsByUser(userId);
  }, [getAccountsByUser, userId]);

  useEffect(() => {
    setAccounts(accountsByUser[userId] || []);
    console.log(accountsByUser[userId]);
  }, [accountsByUser, userId]);

  useEffect(() => {
    if (accounts.length > 0) {
      const nameCheck = checkUserName(accounts[0].owner_names);
      const emailCheck = checkUserEmail(accounts[0].emails);
      setIdentityCheckById(userId, nameCheck && emailCheck);
      setIdentityCheck(user.identity_check);
    }
  }, [
    accounts,
    checkUserEmail,
    checkUserName,
    userId,
    user.identity_check,
    numOfItems,
  ]);

  console.log(user);

  document.getElementsByTagName('body')[0].style.overflow = 'auto'; // to override overflow:hidden from link pane
  return (
    <div>
      <NavigationLink component={Link} to="/">
        BACK TO LOGIN
      </NavigationLink>

      <Banner />
      <UserCard user={user} userId={userId} removeButton={false} linkButton />
      {numOfItems > 0 && (
        <>
          <ErrorMessage />
          {accounts.length > 0 && identityCheck && (
            <ItemCard item={items[0]} userId={userId} />
          )}
          {accounts.length > 0 && !identityCheck && (
            <div>user not identified. Use another form of identification</div>
          )}
        </>
      )}
    </div>
  );
};

export default UserPage;
